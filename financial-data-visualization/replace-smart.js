const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory() && !file.includes('node_modules')) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('.tsx') || file.endsWith('.ts')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk(path.join(__dirname, 'src'));
let changed = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let modified = false;

    // We want to replace all occurrences of http://127.0.0.1:8000/api/ with the intelligent ternary
    // This allows:
    // 1. SSR (Node.js) to hit the backend directly avoiding EADDRINUSE hangs or Next.js single-thread dev server deadlocks
    // 2. Client (Browser) to use relative `/api/` routing back to Next.js proxy, successfully 100% evading any VPN/Clash rules.
    const searchString = "http://127.0.0.1:8000/api/";
    const replaceString = "${typeof window !== 'undefined' ? '' : 'http://127.0.0.1:8000'}/api/";

    if (content.includes("`" + searchString)) {
        content = content.replace(/'(?<!!)http:\/\/127\.0\.0\.1:8000\/api\//g, "`${typeof window !== 'undefined' ? '' : 'http://127.0.0.1:8000'}/api/");
        // Actually wait, simple replace is safer. We know the previous script replaced `/api/` to `http://127.0.0.1:8000/api/`
        // inside backticks ` `.
        content = content.split("`http://127.0.0.1:8000/api/").join("`${typeof window !== 'undefined' ? '' : 'http://127.0.0.1:8000'}/api/");
        modified = true;
    }
    
    // Fallbacks just in case:
    if (content.includes('"http://127.0.0.1:8000/api/')) {
        content = content.split('"http://127.0.0.1:8000/api/').join("`${typeof window !== 'undefined' ? '' : 'http://127.0.0.1:8000'}/api/` + \"");
        // This makes '"http://.../api/foo"' become "`${...}/api/` + "foo""
        modified = true;
    }

    if (modified) {
        fs.writeFileSync(file, content, 'utf8');
        changed++;
        console.log(`Updated: ${file}`);
    }
});

console.log(`Total files fixed with smart prefix: ${changed}`);

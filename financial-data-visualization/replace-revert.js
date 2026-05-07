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

    const targetPattern1 = "`${typeof window !== 'undefined' ? '' : 'http://127.0.0.1:8000'}/api/";
    if (content.includes(targetPattern1)) {
        content = content.split(targetPattern1).join("`/api/");
        modified = true;
    }
    
    // Also revert any lingering http://127.0.0.1:8000/api/
    if (content.includes("`http://127.0.0.1:8000/api/")) {
        content = content.split("`http://127.0.0.1:8000/api/").join("`/api/");
        modified = true;
    }

    if (modified) {
        fs.writeFileSync(file, content, 'utf8');
        changed++;
        console.log(`Reverted: ${file}`);
    }
});

console.log(`Total files reverted to purely relative /api/: ${changed}`);

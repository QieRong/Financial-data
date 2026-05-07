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
    
    // 之前为了不匹配 next.config 里的代理所以找 fetch
    // 现在直接暴力替换所有的 `\`/api/` -> `\`http://127.0.0.1:8000/api/` (因为除了这里几乎没有其他的 /api/)
    // 以及 '"/api/...' 等
    
    let modified = false;

    // 匹配: `/api/
    if (content.includes("`/api/")) {
        content = content.replace(/`\/api\//g, "`http://127.0.0.1:8000/api/");
        modified = true;
    }
    // 匹配: "/api/
    if (content.includes('"/api/')) {
        content = content.replace(/"\/api\//g, '"http://127.0.0.1:8000/api/');
        modified = true;
    }
    // 匹配: '/api/
    if (content.includes("'/api/")) {
        content = content.replace(/'\/api\//g, "'http://127.0.0.1:8000/api/");
        modified = true;
    }

    if (modified) {
        fs.writeFileSync(file, content, 'utf8');
        changed++;
        console.log(`Updated: ${file}`);
    }
});

console.log(`Total files fixed with absolute prefix: ${changed}`);

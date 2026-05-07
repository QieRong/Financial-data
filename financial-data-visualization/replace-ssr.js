const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('.tsx') || file.endsWith('.ts')) {
                results.push(file);
            }
        }
    });
    return results;
}

const dir = path.join(__dirname, 'src');
const files = walk(dir);

let changed = 0;
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    let modified = false;

    // 匹配 fetch('/api/...
    if (content.includes("fetch(`/api/")) {
        content = content.replace(/fetch\(`\/api\//g, "fetch(`http://127.0.0.1:8000/api/");
        modified = true;
    }
    if (content.includes("fetch('/api/")) {
        content = content.replace(/fetch\('\/api\//g, "fetch('http://127.0.0.1:8000/api/");
        modified = true;
    }
    if (content.includes('fetch("/api/')) {
        content = content.replace(/fetch\("\/api\//g, 'fetch("http://127.0.0.1:8000/api/');
        modified = true;
    }

    if (modified) {
        fs.writeFileSync(file, content, 'utf8');
        changed++;
        console.log(`Updated: ${file}`);
    }
});

console.log(`Total files fixed back to absolute backend URL: ${changed}`);

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
    
    // 我们只要找出 fetch('/api/ 或者 fetch( `/api/ 并把它们替换成绝对路径
    // 注意处理反引号包裹的情况
    let modified = false;

    if (content.includes('fetch("/api/')) {
        content = content.replace(/fetch\("\/api\//g, 'fetch("http://127.0.0.1:8000/api/');
        modified = true;
    }
    if (content.includes("fetch('/api/")) {
        content = content.replace(/fetch\('\/api\//g, "fetch('http://127.0.0.1:8000/api/");
        modified = true;
    }
    if (content.includes("fetch(`/api/")) {
        content = content.replace(/fetch\(`\/api\//g, "fetch(`http://127.0.0.1:8000/api/");
        modified = true;
    }

    if (modified) {
        fs.writeFileSync(file, content, 'utf8');
        changed++;
        console.log(`Updated: ${file}`);
    }
});

console.log(`Total files changed back to absolute URL: ${changed}`);

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

    // 通吃的暴力字符串替换，直接将相对路径的 /api 替换为后端的真实来源
    // 这是最安全的做法，适用于 next.js server components 的本机直连
    if (content.indexOf("fetch('/api/") !== -1) {
        content = content.split("fetch('/api/").join("fetch('http://127.0.0.1:8000/api/");
        modified = true;
    }
    if (content.indexOf('fetch("/api/') !== -1) {
        content = content.split('fetch("/api/').join('fetch("http://127.0.0.1:8000/api/');
        modified = true;
    }
    if (content.indexOf("fetch(`/api/") !== -1) {
        content = content.split("fetch(`/api/").join("fetch(`http://127.0.0.1:8000/api/");
        modified = true;
    }

    if (modified) {
        fs.writeFileSync(file, content, 'utf8');
        changed++;
        console.log(`Updated: ${file}`);
    }
});

console.log(`Total files fixed using split-join: ${changed}`);

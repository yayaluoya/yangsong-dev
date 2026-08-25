// 更新 index.html 中的「更新日期」，精确到分钟（本地时区）
const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '..', 'index.html');

const now = new Date();
const pad = (n) => String(n).padStart(2, '0');
const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

const html = fs.readFileSync(htmlPath, 'utf8');
const next = html.replace(
  /(<div\b[^>]*id="updateDate"[^>]*>)[^<]*(<\/div>)/,
  `$1${stamp}$2`
);

if (next === html) {
  console.error('未找到 id="updateDate" 节点，未做更新');
  process.exit(1);
}

fs.writeFileSync(htmlPath, next, 'utf8');
console.log(`更新日期已写入：${stamp}`);

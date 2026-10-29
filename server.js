// Минимальный сервер авторизации МИРЭА Match через Telegram Bot API.
// Node.js 18+. Установите BOT_TOKEN и BOT_USERNAME в переменных окружения.
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = Number(process.env.PORT || 3000);
const BOT_TOKEN = process.env.BOT_TOKEN;
const BOT_USERNAME = (process.env.BOT_USERNAME || '').replace(/^@/, '');
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || crypto.randomBytes(24).toString('hex');
const HTML_FILE = path.join(__dirname, 'МИРЭА_Match_Telegram.html');
const pending = new Map();
const users = new Map();

if (!BOT_TOKEN || !BOT_USERNAME) {
  console.error('Нужно задать BOT_TOKEN и BOT_USERNAME. См. README.txt');
  process.exit(1);
}

function json(res, status, obj) {
  res.writeHead(status, {'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store'});
  res.end(JSON.stringify(obj));
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let s = '';
    req.on('data', c => { s += c; if (s.length > 10000) reject(new Error('body too large')); });
    req.on('end', () => { try { resolve(JSON.parse(s || '{}')); } catch { reject(new Error('invalid json')); } });
    req.on('error', reject);
  });
}
async function tg(method, body) {
  const r = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body)
  });
  const d = await r.json();
  if (!d.ok) throw new Error(d.description || 'Telegram API error');
  return d.result;
}
function cleanup() {
  const now = Date.now();
  for (const [k,v] of pending) if (v.expires < now) pending.delete(k);
}
setInterval(cleanup, 60000).unref();

const server = http.createServer(async (req,res) => {
  const u = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  try {
    if (req.method === 'GET' && u.pathname === '/') {
      const html = fs.readFileSync(HTML_FILE);
      res.writeHead(200, {'Content-Type':'text/html; charset=utf-8', 'Cache-Control':'no-store'});
      return res.end(html);
    }
    if (req.method === 'POST' && u.pathname === '/api/auth/request') {
      const token = crypto.randomBytes(18).toString('hex');
      pending.set(token, {code:String(crypto.randomInt(100000,1000000)), expires:Date.now()+10*60*1000, chatId:null, user:null, sent:false});
      return json(res,200,{token,bot_url:`https://t.me/${BOT_USERNAME}?start=auth_${token}`});
    }
    if (req.method === 'POST' && u.pathname === '/api/auth/verify') {
      const b = await readBody(req), p = pending.get(String(b.token || ''));
      if (!p || p.expires < Date.now()) return json(res,400,{error:'Запрос истёк. Получи новый код.'});
      if (!p.chatId || !p.sent) return json(res,409,{error:'Сначала открой бота в Telegram и нажми Start.'});
      if (String(b.code || '') !== p.code) return json(res,400,{error:'Неверный код.'});
      const account = `tg:${p.user.id}`;
      users.set(account,{id:p.user.id,username:p.user.username || null,first_name:p.user.first_name || ''});
      pending.delete(String(b.token));
      return json(res,200,{ok:true,account,username:p.user.username || null});
    }
    if (req.method === 'POST' && u.pathname === '/telegram-webhook') {
      if (req.headers['x-telegram-bot-api-secret-token'] !== WEBHOOK_SECRET)
        return json(res,403,{error:'forbidden'});
      const update = await readBody(req);
      const msg = update.message;
      if (msg && msg.chat && msg.text) {
        const m = msg.text.match(/^\/start(?:@\w+)?\s+auth_([a-f0-9]{36})$/);
        if (m) {
          const p = pending.get(m[1]);
          if (!p || p.expires < Date.now()) {
            await tg('sendMessage',{chat_id:msg.chat.id,text:'Ссылка устарела. Вернись на сайт и запроси новый код.'});
          } else {
            p.chatId = msg.chat.id;
            p.user = msg.from;
            p.sent = true;
            await tg('sendMessage',{chat_id:msg.chat.id,text:`Код авторизации МИРЭА Match: ${p.code}\n\nКод действует 10 минут. Никому его не сообщай.`});
          }
        } else if (/^\/start(?:@\w+)?$/.test(msg.text.trim())) {
          await tg('sendMessage',{chat_id:msg.chat.id,text:'Привет! Чтобы войти, сначала запроси код на сайте МИРЭА Match, затем открой ссылку на бота с сайта.'});
        }
      }
      return json(res,200,{ok:true});
    }
    return json(res,404,{error:'not found'});
  } catch(e) {
    console.error(e);
    return json(res,500,{error:'Внутренняя ошибка сервера'});
  }
});
server.listen(PORT, () => console.log(`МИРЭА Match: http://localhost:${PORT}`));

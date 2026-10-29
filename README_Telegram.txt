МИРЭА Match — Telegram auth + PostgreSQL profiles and likes

Files:
- server.js
- МИРЭА_Match_Telegram.html
- package.json

Render settings:
- Build Command: npm install
- Start Command: npm start

Environment variables already needed:
- BOT_TOKEN
- BOT_USERNAME
- WEBHOOK_SECRET
- DATABASE_URL (Internal Database URL of Render PostgreSQL)

The server creates profiles and likes tables automatically on startup.
Likes are stored in PostgreSQL and the HTML includes two profile sections:
- Кто тебя лайкнул
- Кого ты лайкнул

After replacing the files in GitHub, wait for Render auto-deploy or use Manual Deploy -> Deploy latest commit.
Do not share BOT_TOKEN, WEBHOOK_SECRET, DATABASE_URL, or database passwords.
Note: the current implementation stores likes and profiles server-side. Chat history/matches are not yet fully synchronized between devices.

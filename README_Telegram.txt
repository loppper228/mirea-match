МИРЭА Match — Telegram авторизация и общие анкеты

Файлы:
- МИРЭА_Match_Telegram.html — интерфейс сайта
- server.js — Node.js сервер, Telegram webhook, API профилей и PostgreSQL
- package.json — зависимости и команда запуска

Render настройки:
Build Command: npm install
Start Command: npm start
Environment Variables:
BOT_TOKEN = токен Telegram-бота (секрет)
BOT_USERNAME = MireaMatchbot
WEBHOOK_SECRET = то же значение, что использовано при регистрации webhook
DATABASE_URL = Internal Database URL из PostgreSQL Render

PostgreSQL: сервер создаёт таблицу profiles при запуске. Анкеты доступны только авторизованным через Telegram пользователям. Фото обязательно. Профили хранятся в общей базе.

Важно:
- Не публикуйте BOT_TOKEN, DATABASE_URL или WEBHOOK_SECRET.
- Бесплатная PostgreSQL Render истекает через 30 дней; до истечения экспортируйте данные или перейдите на подходящий постоянный тариф.
- Сессии хранятся в памяти процесса, поэтому после перезапуска сервера пользователям может потребоваться войти заново.
- Чаты и лайки пока остаются локальными в браузере; общими являются анкеты.

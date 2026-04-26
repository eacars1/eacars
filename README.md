# EA Cars — прокат авто в Астане

Одностраничный сайт на чистом HTML/CSS/JS. Деплоится через **Cloudflare Pages** (push в `main` → автодеплой).

## Структура

```
eacars1/
├─ index.html              ← весь сайт (HTML + CSS + JS в одном файле)
├─ rate.json               ← курс USD от НБ РК (обновляется раз в сутки автоматически)
├─ img/                    ← фото машин
├─ functions/
│   └─ recognize.js        ← Cloudflare Pages Function: прокси к Claude API для распознавания фото документов
├─ .github/workflows/
│   └─ update-rate.yml     ← GitHub Action, тянет курс с nationalbank.kz раз в сутки в 13:00 Астаны
└─ .gitignore
```

## Локальный запуск

Достаточно открыть `index.html` в браузере. Для удобства в VS Code:

1. Установить расширение **Live Server**
2. ПКМ по `index.html` → **Open with Live Server**

Либо просто:
```
start index.html
```

## Деплой

Любой push в ветку `main` на GitHub → Cloudflare Pages автоматически билдит и публикует.

## Переменные окружения (в Cloudflare Pages)

- `CLAUDE_API_KEY` — ключ Anthropic API для функции распознавания документов

## Как обновляется курс

GitHub Action (`update-rate.yml`) раз в сутки запрашивает курс USD у НБ РК и коммитит `rate.json`. Сайт читает этот файл при загрузке и пересчитывает цены в долларах.

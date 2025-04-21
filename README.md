# NeuroSearchEngine

Объединенное приложение NeuroSearchEngine, включающее фронтенд и бэкенд. Приложение позволяет выполнять поиск информации в интернете с последующей обработкой результатов с помощью Gemini AI.

## Требования

- Node.js (v18+)
- Python (v3.8+)
- NPM (v8+)
- pip

## Установка

1. Клонируйте репозиторий:
```bash
git clone <url-репозитория>
cd NeuroSearchEngineFull
```

2. Установите зависимости:
```bash
npm install
```

Эта команда установит как зависимости Node.js, так и Python.

## Настройка

1. Создайте файл `.env` в папке `backend`, используя `.env.example` как шаблон:
```bash
cp backend/.env.example backend/.env
```

2. Внесите необходимые изменения в файл `.env`:
   - `GOOGLE_API_KEY` - ключ API для Gemini (получите на [Google AI Studio](https://makersuite.google.com/app/apikey))
   - `GOOGLE_CSE_API_KEY` - ключ API для Google Programmable Search Engine (получите в [Google Cloud Console](https://console.cloud.google.com/apis/credentials))
   - `GOOGLE_CSE_ID` - ID поисковой системы Google Programmable Search Engine (настраивается на [Custom Search Engine](https://programmablesearchengine.google.com/))

## Запуск

Для запуска приложения достаточно выполнить:

```bash
npm start
```

Это запустит как бэкенд (на порту 5000), так и фронтенд (на порту 3000).

Фронтенд будет доступен по адресу: http://localhost:3000
API бэкенда будет доступен по адресу: http://localhost:5000

## Сборка проекта

Для сборки проекта выполните:

```bash
npm run build
```

Это создаст оптимизированную версию фронтенда в папке `frontend/dist`.

## Структура проекта

- `frontend/` - код React-приложения
- `backend/` - код Flask API-сервера
  - `main.py` - основной файл с API
  - `requirements.txt` - зависимости Python
  - `.env` - файл с переменными окружения (не включен в репозиторий)
  - `.env.example` - пример файла с переменными окружения

## Разработка

### Фронтенд

Для запуска только фронтенда в режиме разработки:

```bash
cd frontend
npm run dev
```

### Бэкенд

Для запуска только бэкенда:

```bash
cd backend
python main.py
```

## Примечания по безопасности

- Никогда не включайте файл `.env` с реальными API ключами в репозиторий
- Используйте `.env.example` как шаблон для локальной настройки
- При деплое на сервер настраивайте переменные окружения через систему CI/CD или панель управления хостинга 
import requests
from bs4 import BeautifulSoup
import google.generativeai as genai
import os
from dotenv import load_dotenv
from googleapiclient.discovery import build
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO
import logging

load_dotenv()

# Создаем Flask-приложение здесь
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})
socketio = SocketIO(app, cors_allowed_origins="*")

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# API ключ Gemini
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
# API ключ Google Programmable Search Engine
GOOGLE_CSE_API_KEY = os.getenv("GOOGLE_CSE_API_KEY")
# ID Google Programmable Search Engine
GOOGLE_CSE_ID = os.getenv("GOOGLE_CSE_ID")

if not GOOGLE_API_KEY:
    raise ValueError("Не найден API ключ Gemini. Убедитесь, что он установлен в переменных окружения или файле .env.")
if not GOOGLE_CSE_API_KEY:
    raise ValueError("Не найден API ключ Google Programmable Search Engine. Убедитесь, что он установлен в переменных окружения или файле .env.")
if not GOOGLE_CSE_ID:
    raise ValueError("Не найден ID поисковой системы Google Programmable Search Engine. Убедитесь, что он установлен в переменных окружения или файле .env.")

genai.configure(api_key=GOOGLE_API_KEY)
model = genai.GenerativeModel('gemini-2.0-flash-exp')

# Функция для отправки лог-сообщений через WebSocket
def send_log(message, log_type="info"):
    socketio.emit("log_message", {"message": message, "type": log_type})
    if log_type == "error":
        logger.error(message)
    elif log_type == "warning":
        logger.warning(message)
    else:
        logger.info(message)

def search_relevant_urls_google(topic, api_key, cse_id, num_results=5):    # Ищем URL-адреса в Google Programmable Search Engine.
    try:
        send_log(f"Начинаем поиск по теме: '{topic}'...")
        service = build("customsearch", "v1", developerKey=api_key)
        res = service.cse().list(q=topic, cx=cse_id, num=num_results).execute()
        results = [item['link'] for item in res.get('items', [])]
        send_log(f"Найдено {len(results)} результатов")
        return results
    except Exception as e:
        error_msg = f"Ошибка при выполнении поискового запроса к Google CSE: {e}"
        send_log(error_msg, "error")
        return []

def fetch_html_content(url):    # Парсим HTML-контент по заданному URL.
    try:
        send_log(f"Загрузка страницы: {url}")
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        send_log(f"Страница загружена успешно: {url}")
        return response.text
    except requests.exceptions.RequestException as e:
        error_msg = f"Ошибка при загрузке страницы {url}: {e}"
        send_log(error_msg, "error")
        return None

def extract_text_from_html(html_content):   # Извлекаем текст из HTML-контента, удаляя теги.
    if not html_content:
        send_log("Получен пустой HTML контент", "warning")
        return ""
    send_log("Извлечение текста из HTML...")
    soup = BeautifulSoup(html_content, 'html.parser')
    # Удаляем скрипты и стили
    for script in soup(["script", "style"]):
        script.decompose()
    # Получаем текст, разбиваем на строки и удаляем лишние пробелы
    text = ' '.join(soup.stripped_strings)
    send_log(f"Извлечено {len(text)} символов текста")
    return text

def summarize_with_gemini(text, topic): # Отправляем текст в Gemini API для получения сводки.
    if not text.strip():
        send_log("Не удалось извлечь значимый текст для обработки", "warning")
        return "Не удалось извлечь значимый текст для обработки."

    send_log("Отправляем запрос к Gemini API...")
    prompt = f"Пожалуйста, составьте краткую сводку информации по теме '{topic}', основываясь на следующем тексте:\n\n{text}\n\nСводка должна быть написана на человеческом языке и содержать ключевые моменты."
    try:
        response = model.generate_content(prompt)
        send_log("Получен ответ от Gemini API")
        return response.text
    except Exception as e:
        error_msg = f"Ошибка при обращении к Gemini API: {e}"
        send_log(error_msg, "error")
        return "Произошла ошибка при обработке текста с помощью Gemini."

# Маршрут для проверки работоспособности сервера
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok'}), 200

# Теперь декоратор @app.route будет работать корректно
@app.route('/api/summarize', methods=['POST'])
def summarize():
    data = request.get_json()
    topic = data.get('topic')
    search_engine = data.get('engine', 'google')

    if not topic:
        send_log("Не указана тема для поиска", "error")
        return jsonify({'error': 'Topic is required'}), 400

    send_log(f"Получен запрос на поиск информации по теме: '{topic}' (поисковик: {search_engine})")

    relevant_urls = search_relevant_urls_google(topic, GOOGLE_CSE_API_KEY, GOOGLE_CSE_ID)

    if not relevant_urls:
        send_log("Не удалось найти релевантные URL", "error")
        return jsonify({'error': 'Could not find relevant URLs'}), 500
    else:
        all_extracted_text = ""
        for url in relevant_urls:
            send_log(f"Обрабатываем страницу: {url}")
            html_content = fetch_html_content(url)
            if html_content:
                text = extract_text_from_html(html_content)
                all_extracted_text += text + "\n\n"

        if all_extracted_text.strip():
            send_log("Отправляем извлеченный текст для анализа в Gemini...")
            summary = summarize_with_gemini(all_extracted_text, topic)
            send_log("Анализ завершен, отправляем результат")
            return jsonify({'summary': summary})
        else:
            send_log("Не удалось извлечь текст из страниц", "error")
            return jsonify({'error': 'Could not extract text from pages'}), 500

# Обработчик подключения WebSocket
@socketio.on('connect')
def handle_connect():
    send_log("Клиент подключился к WebSocket")

# Обработчик отключения WebSocket
@socketio.on('disconnect')
def handle_disconnect():
    send_log("Клиент отключился от WebSocket")

if __name__ == "__main__":
    send_log("Запуск сервера...")
    socketio.run(app, debug=True, port=5000, host='0.0.0.0', allow_unsafe_werkzeug=True)
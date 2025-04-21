import { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import Message from '../Message/Message';
import Input from '../Input/Input';
import LogsPanel from '../LogsPanel/LogsPanel';
import { FaMoon, FaSun } from 'react-icons/fa';
import { FaTerminal } from 'react-icons/fa';
import io from 'socket.io-client';
import './Chat.scss';

function Chat({ updateTheme, theme }) {
    const [summary, setSummary] = useState('');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [rippleStyle, setRippleStyle] = useState(null);
    const chatContainerRef = useRef(null);
    const [searchEngine, setSearchEngine] = useState("google");
    const [logs, setLogs] = useState([]);
    const [showLogs, setShowLogs] = useState(false);
    const [socket, setSocket] = useState(null);
    const [isInitialRender, setIsInitialRender] = useState(true);
    const [isThemeChanging, setIsThemeChanging] = useState(false);
    const [isProcessingAction, setIsProcessingAction] = useState(false);
    const messagesContainerRef = useRef(null);
    const inputAreaRef = useRef(null);

    // Инициализация соединения с WebSocket
    useEffect(() => {
        const newSocket = io('http://localhost:5000');
        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('Connected to WebSocket server');
        });

        newSocket.on('log_message', (logEntry) => {
            setLogs(prevLogs => [...prevLogs, { ...logEntry, isNew: true }]);
        });

        // Добавляем анимацию при первой загрузке
        const timer = setTimeout(() => {
            setIsInitialRender(false);
        }, 100);

        return () => {
            if (newSocket) newSocket.disconnect();
            clearTimeout(timer);
        };
    }, []);

    // Устанавливаем CSS переменную для анимации входа логов
    useEffect(() => {
        logs.forEach((log, index) => {
            if (log.isNew) {
                // Удаляем флаг isNew через некоторое время, чтобы предотвратить повторные анимации
                setTimeout(() => {
                    setLogs(prevLogs =>
                        prevLogs.map((l, i) =>
                            i === index ? { ...l, isNew: false } : l
                        )
                    );
                }, 1000);
            }
        });
    }, [logs]);

    // Добавляем обработчик для корректного отображения на мобильных устройствах
    useEffect(() => {
        function updateLayoutForMobile() {
            if (!chatContainerRef.current) return;
            
            const isMobile = window.matchMedia('(max-width: 767px)').matches;
            
            if (isMobile) {
                const inputHeight = inputAreaRef.current?.offsetHeight || 61;
                const bottomInset = 50;
                
                // Сбрасываем стили, когда логи закрыты
                if (messagesContainerRef.current) {
                    messagesContainerRef.current.style.marginBottom = `${inputHeight + bottomInset}px`;
                }
            }
        }
        
        // Выполняем обновление макета и добавляем слушатель изменения размера окна
        updateLayoutForMobile();
        window.addEventListener('resize', updateLayoutForMobile);
        
        return () => window.removeEventListener('resize', updateLayoutForMobile);
    }, []);

    const toggleSearchEngine = () => {
        const buttonElement = document.querySelector('.engine-toggle');

        // Добавляем класс для анимации
        if (buttonElement) {
            buttonElement.classList.add('engine-changing');
            setTimeout(() => buttonElement.classList.remove('engine-changing'), 300);
        }

        setSearchEngine(prev => {
            if (prev === "google") return "yandex";
            if (prev === "yandex") return "duckduckgo";
            return "google";
        });
    };

    const getSearchEngineName = (engine) => {
        switch(engine) {
            case "google": return "Google";
            case "yandex": return "Яндекс";
            case "duckduckgo": return "DuckDuckGo";
            default: return "Google";
        }
    };

    const handleTopicSubmit = async (topic) => {
        // Предотвращаем отправку, если уже выполняется другое действие
        if (isProcessingAction || isLoading) return;
        
        setIsProcessingAction(true);
        
        // Добавляем анимацию отправки сообщения
        const inputElement = document.querySelector('.input-container input');
        if (inputElement) {
            inputElement.classList.add('sending');
            setTimeout(() => inputElement.classList.remove('sending'), 300);
        }

        setIsLoading(true);
        setError(null);
        setSummary('');
        setLogs([]);

        try {
            const response = await fetch('/api/summarize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic, engine: searchEngine }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Something went wrong');
            }

            const data = await response.json();
            setSummary(data.summary);
        } catch (error) {
            setError(error.message);
        } finally {
            setIsLoading(false);
            setIsProcessingAction(false);
        }
    };

    const formatSummary = (text) => {
        text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        const lines = text.split('\n');
        let formattedText = '';
        let inList = false;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            if (line.startsWith('# ')) {
                formattedText += `<h1>${line.substring(2).trim()}</h1>`;
            } else if (line.startsWith('## ')) {
                formattedText += `<h2>${line.substring(3).trim()}</h2>`;
            } else if (line.startsWith('* ')) {
                if (!inList) {
                    formattedText += '<ul>';
                    inList = true;
                }
                formattedText += `<li>${line.substring(2).trim()}</li>`;
            } else {
                if (inList) {
                    formattedText += '</ul>';
                    inList = false;
                }
                formattedText += line ? `<p>${line}</p>` : '<br />';
            }
        }

        if (inList) {
            formattedText += '</ul>';
        }

        return formattedText;
    };

    const toggleTheme = (event) => {
        // Предотвращаем выполнение, если уже выполняется другое действие
        if (isThemeChanging || isProcessingAction) return;
        
        setIsProcessingAction(true);
        setIsThemeChanging(true);
        
        // Анимируем иконку перед сменой темы
        const themeButton = event.currentTarget;
        themeButton.classList.add('theme-toggling');

        // Устанавливаем ripple относительно точки клика на экране
        const x = event.clientX;
        const y = event.clientY;
        setRippleStyle({ top: y, left: x });

        // Добавляем класс для анимации размытия и изменения масштаба
        chatContainerRef.current?.classList.add('theme-transition');

        // Задержка смены темы для синхронизации с анимацией
        setTimeout(() => {
            const newTheme = theme === 'light' ? 'dark' : 'light';
            updateTheme(newTheme);
            
            // Удаляем классы анимации
            setTimeout(() => {
                chatContainerRef.current?.classList.remove('theme-transition');
                themeButton.classList.remove('theme-toggling');
                
                setIsThemeChanging(false);
                setIsProcessingAction(false);
            }, 300);
        }, 300);
    };

    const toggleLogsPanel = () => {
        // Предотвращаем выполнение, если уже выполняется другое действие
        if (isProcessingAction || isThemeChanging) return;
        
        // Анимация кнопки
        const logsButton = document.querySelector('.logs-toggle');
        if (logsButton) {
            logsButton.classList.add('logs-toggling');
            setTimeout(() => logsButton.classList.remove('logs-toggling'), 300);
        }

        // Инвертируем состояние логов
        setShowLogs(!showLogs);
    };

    const clearLogs = () => {
        setLogs([]);
    };

    return (
        <>
            <div
                ref={chatContainerRef}
                className={`chat-container ${theme === 'dark' ? 'theme-dark' : 'theme-light'} ${isInitialRender ? 'initial-render' : ''} ${isThemeChanging ? 'theme-changing' : ''} ${isProcessingAction ? 'processing-action' : ''}`}
            >
                <div className="chat-header">
                    <h2>Чат с ботом</h2>
                    <div className="header-buttons">
                        <button className="engine-toggle" onClick={toggleSearchEngine}>
                            Поиск: {getSearchEngineName(searchEngine)}
                        </button>
                        <button 
                            className="logs-toggle" 
                            onClick={toggleLogsPanel} 
                            aria-label="Показать логи"
                            disabled={isProcessingAction || isThemeChanging}
                        >
                            <FaTerminal />
                        </button>
                        <button 
                            className="theme-toggle" 
                            onClick={toggleTheme} 
                            data-theme-toggle
                            aria-label={theme === 'light' ? 'Переключить на темную тему' : 'Переключить на светлую тему'}
                            disabled={isProcessingAction || isThemeChanging}
                        >
                            {theme === 'light' ? <FaMoon /> : <FaSun />}
                        </button>
                    </div>
                </div>

                <div className="chat-messages" ref={messagesContainerRef}>
                    {isLoading && (
                        <div className="loading-indicator">
                            <span className="thinking-text">Ищу информацию...</span>
                            <div className="spinner"></div>
                        </div>
                    )}

                    {error && (
                        <div className="error-message">
                            <p>Ошибка: {error}</p>
                        </div>
                    )}

                    {summary && (
                        <Message type="bot" content={summary} />
                    )}
                </div>

                <div className="input-area" ref={inputAreaRef}>
                    <Input onSubmit={handleTopicSubmit} />
                </div>

                {rippleStyle && <div className="ripple" style={rippleStyle}></div>}
            </div>
            
            {/* Отдельный компонент LogsPanel */}
            <LogsPanel 
                isVisible={showLogs}
                logs={logs}
                theme={theme}
                onClose={() => setShowLogs(false)}
                onClear={clearLogs}
            />
        </>
    );
}

Chat.propTypes = {
    updateTheme: PropTypes.func.isRequired,
    theme: PropTypes.string.isRequired,
};

export default Chat;
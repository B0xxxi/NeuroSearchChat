import React, { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import './LogsPanel.scss';

const LogsPanel = ({ 
  isVisible, 
  logs, 
  theme, 
  onClose, 
  onClear 
}) => {
  const logsEndRef = useRef(null);
  const panelRef = useRef(null);
  
  // Автоматическая прокрутка к последнему сообщению
  useEffect(() => {
    if (logsEndRef.current && isVisible) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isVisible]);

  // Обработка ESC для закрытия панели
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape' && isVisible) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscKey);
    return () => window.removeEventListener('keydown', handleEscKey);
  }, [isVisible, onClose]);

  // Определение класса для типа лога
  const getLogTypeClass = (type) => {
    switch(type) {
      case 'error': return 'log-error';
      case 'warning': return 'log-warning';
      default: return 'log-info';
    }
  };

  if (!isVisible) return null;

  return (
    <div className="logs-panel-overlay">
      <div 
        className={`logs-panel-container ${theme === 'dark' ? 'theme-dark' : 'theme-light'}`}
        ref={panelRef}
      >
        <div className="logs-panel-header">
          <h3>Логи сервера</h3>
          <div className="logs-panel-actions">
            <button 
              className="clear-logs-btn" 
              onClick={onClear}
            >
              Очистить
            </button>
            <button 
              className="close-logs-btn" 
              onClick={onClose}
              aria-label="Закрыть логи"
            >
              ✕
            </button>
          </div>
        </div>
        <div className="logs-panel-content">
          {logs.length === 0 ? (
            <p className="no-logs">Логи появятся здесь во время обработки запроса...</p>
          ) : (
            logs.map((log, index) => (
              <div 
                key={index} 
                className={`log-entry ${getLogTypeClass(log.type)} ${log.isNew ? 'new-log' : ''}`}
              >
                {log.message}
              </div>
            ))
          )}
          <div ref={logsEndRef} />
        </div>
      </div>
    </div>
  );
};

LogsPanel.propTypes = {
  isVisible: PropTypes.bool.isRequired,
  logs: PropTypes.array.isRequired,
  theme: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  onClear: PropTypes.func.isRequired
};

export default LogsPanel; 
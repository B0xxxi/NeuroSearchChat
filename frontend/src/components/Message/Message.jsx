import 'react';
import PropTypes from 'prop-types';
import './Message.scss';

function Message({ type, content }) {
    return (
        <div className={`message ${type} clearfix`}>
            <div className="message-text" dangerouslySetInnerHTML={{ __html: formatContent(content) }}></div>
        </div>
    );
}

// Функция для форматирования контента (включая поддержку разметки)
function formatContent(text) {
    if (!text) return '';
    
    // Замена жирного текста
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Замена курсива
    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Обработка заголовков и списков
    const lines = text.split('\n');
    let formattedText = '';
    let inList = false;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (line.startsWith('# ')) {
            if (inList) {
                formattedText += '</ul>';
                inList = false;
            }
            formattedText += `<h1>${line.substring(2).trim()}</h1>`;
        } else if (line.startsWith('## ')) {
            if (inList) {
                formattedText += '</ul>';
                inList = false;
            }
            formattedText += `<h2>${line.substring(3).trim()}</h2>`;
        } else if (line.startsWith('* ') || line.startsWith('- ')) {
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
}

Message.propTypes = {
    type: PropTypes.oneOf(['user', 'bot']).isRequired,
    content: PropTypes.string.isRequired
};

export default Message;
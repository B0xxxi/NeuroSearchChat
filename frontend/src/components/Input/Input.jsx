import { useState } from 'react';
import PropTypes from 'prop-types';
import { FaPaperPlane } from 'react-icons/fa';
import './Input.scss';

function Input({ onSubmit }) {
    const [topic, setTopic] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (topic.trim()) {
            onSubmit(topic);
            setTopic('');
        }
    };

    return (
        <form className="input-container" onSubmit={handleSubmit}>
            <input
                type="text"
                placeholder="Введите тему..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                aria-label="Введите тему для поиска"
            />
            <button type="submit" aria-label="Отправить запрос">
                <FaPaperPlane />
            </button>
        </form>
    );
}

Input.propTypes = {
    onSubmit: PropTypes.func.isRequired
};

export default Input;
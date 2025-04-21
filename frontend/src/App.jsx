import React, { useState, useEffect, useRef } from 'react';
import Chat from './components/Chat/Chat';
import './App.scss';

function App() {
    const [theme, setTheme] = useState('light');
    const [isAnimating, setIsAnimating] = useState(false);
    const appRef = useRef(null);

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        const initialTheme = savedTheme || 'light';
        setTheme(initialTheme);
        document.documentElement.className = `${initialTheme}-theme`;
    }, []);

    const updateTheme = (newTheme) => {
        if (isAnimating) return;

        setIsAnimating(true);

        const animationElement = document.createElement('div');
        animationElement.classList.add('theme-transition-overlay');
        animationElement.classList.add(`from-${theme}-theme`);
        animationElement.classList.add(`to-${newTheme}-theme`);

        const themeToggleButton = document.querySelector('[data-theme-toggle]');
        if (themeToggleButton) {
            const rect = themeToggleButton.getBoundingClientRect();
            animationElement.style.left = `${rect.left + rect.width / 2}px`;
            animationElement.style.top = `${rect.top + rect.height / 2}px`;
        }

        appRef.current.appendChild(animationElement);

        animationElement.addEventListener('animationend', () => {
            setTheme(newTheme);
            document.documentElement.className = `${newTheme}-theme`;
            localStorage.setItem('theme', newTheme);
            
            setTimeout(() => {
                animationElement.remove();
                setIsAnimating(false);
            }, 200);
        });
    };

    return (
        <div ref={appRef} className={`app ${theme}-theme`}>
            <Chat updateTheme={updateTheme} theme={theme} />
        </div>
    );
}

export default App;
import { useEffect } from 'react';
import useLocalStorage from './useLocalStorage';

type Theme = 'light' | 'dark';

function useTheme(): [Theme, () => void] {
    const [theme, setTheme] = useLocalStorage<Theme>('theme', 'dark');

    useEffect(() => {
        const root = window.document.documentElement;
        
        root.classList.remove(theme === 'dark' ? 'light' : 'dark');
        root.classList.add(theme);

    }, [theme]);
    
    const toggleTheme = () => {
        setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
    };

    return [theme, toggleTheme];
}

export default useTheme;

import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

// Khong dung StrictMode: tranh goi authorize 2 lan trong dev (ma code dung 1 lan).
createRoot(document.getElementById('root')!).render(<App />);

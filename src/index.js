import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';        // for Tailwind
import App from './app';     // your bracket component

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);
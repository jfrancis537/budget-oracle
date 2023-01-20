import { createRoot } from 'react-dom/client';
import { App } from './App';
import { UserManager } from './Processing/Managers/UserManager';

import './styles/global.css';

async function start() {
  createRoot(document.getElementById('root')!).render(<App />);
  await UserManager.init();
}

start();
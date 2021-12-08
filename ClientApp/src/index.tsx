import React from 'react';
import ReactDOM from 'react-dom';
import { App } from './App';
import { UserManager } from './Processing/Managers/UserManager';

import './styles/global.css';

function handleUncaughtError(event: ErrorEvent) {
  if (UserManager.isLoggedIn && UserManager.username === 'francisjp') {
    alert(event.message);
  }
}

async function start() {
  ReactDOM.render(
    <App />,
    document.getElementById('root')
  );
  await UserManager.init();
  window.addEventListener('error', handleUncaughtError);
}

start();
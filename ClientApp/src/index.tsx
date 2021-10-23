import React from 'react';
import ReactDOM from 'react-dom';
import { App } from './App';
import { AppStateManager } from './Processing/Managers/AppStateManager';
import { GroupManager } from './Processing/Managers/GroupManager';
import { LoginManager } from './Processing/Managers/LoginManager';

import './styles/global.css';

async function start() {
  ReactDOM.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
    document.getElementById('root')
  );
  await LoginManager.init();
}

start();
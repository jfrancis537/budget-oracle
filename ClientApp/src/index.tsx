import React from 'react';
import ReactDOM from 'react-dom';
import { App } from './App';
import { UserManager } from './Processing/Managers/UserManager';

import './styles/global.css';

async function start() {
  ReactDOM.render(
    <App />,
    document.getElementById('root')
  );
  await UserManager.init();
}

start();
import React from 'react';

import MyRoutes from './routes';

function hasMinimumScreen() {
  const minWidth = 769;
  const minHeight = 600;

  return window.innerWidth >= minWidth && window.innerHeight >= minHeight;
}

if (!hasMinimumScreen()) {
  document.body.innerHTML = `
    <div style="
      height:100vh;
      display:flex;
      align-items:center;
      justify-content:center;
      background:#0f0f0f;
      color:white;
      font-family:system-ui;
      text-align:center;
      padding:40px;
    ">
      <div>
        <h1>Dispositivo não suportado</h1>
        <p>O Pax funciona apenas em tablets, notebooks e desktops.</p>
      </div>
    </div>
  `;
  throw new Error("Dispositivo móvel bloqueado");
}

function App() {
  return (
    <MyRoutes />
  );
}

export default App;

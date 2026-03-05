import React from 'react';

import MyRoutes from './routes';
import GlobalRuntimeGuard from './components/globalRuntimeGuard';

function hasMinimumScreen() {
  const minWidth = 600;
  const minHeight = 600;

  return window.innerWidth >= minWidth && window.innerHeight >= minHeight;
}

function App() {
  /*if (!hasMinimumScreen()) {
    return (
      <div style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0f0f0f",
        color: "white",
        fontFamily: "system-ui",
        textAlign: "center",
        padding: 40
      }}>
        <div>
          <h1>Dispositivo não suportado</h1>
          <p>O Pax funciona apenas em tablets, notebooks e desktops.</p>
        </div>
      </div>
    );
  }*/

  return (
    <>
      <MyRoutes />
      <GlobalRuntimeGuard />
    </>
  );
}

export default App;

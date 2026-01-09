import React from 'react';
import ReactDOM from 'react-dom/client';
import './style/index.css';
import App from './App';

document.addEventListener("contextmenu", e => e.preventDefault());
document.addEventListener("dragstart", e => e.preventDefault());

let lostFocus = false;

window.addEventListener("blur", () => {
  lostFocus = true;
  document.body.classList.add("pax-protected");
});

window.addEventListener("focus", () => {
  if (lostFocus) {
    document.body.classList.remove("pax-protected");
    lostFocus = false;
  }
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

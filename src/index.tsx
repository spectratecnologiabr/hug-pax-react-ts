import React from 'react';
import ReactDOM from 'react-dom/client';
import './style/index.css';
import App from './App';

document.addEventListener("contextmenu", e => e.preventDefault());
document.addEventListener("dragstart", e => e.preventDefault());

let lostFocus = false;
const EDUCATOR_MODULE_PREFIXES = [
  "/dashboard",
  "/courses",
  "/course/",
  "/profile",
  "/notifications",
  "/certificates",
  "/helpdesk",
];

function isEducatorModulePath(pathname: string) {
  if (pathname === "/course") return true;
  return EDUCATOR_MODULE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

window.addEventListener("blur", () => {
  lostFocus = true;
  if (isEducatorModulePath(window.location.pathname)) {
    document.body.classList.add("pax-protected");
  } else {
    document.body.classList.remove("pax-protected");
  }
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

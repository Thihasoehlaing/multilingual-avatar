import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "@/store";
import { AppRouter } from "./app/Router";
import './styles/index.css'

import { logout, rehydrate } from "@/store/auth.slice";

window.addEventListener("focus", () => store.dispatch(rehydrate()));
window.addEventListener("auth:unauthorized", () => store.dispatch(logout()));

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <AppRouter />
    </Provider>
  </React.StrictMode>
);

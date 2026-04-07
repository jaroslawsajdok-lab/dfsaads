import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

window.addEventListener("unhandledrejection", (event) => {
  const msg = event.reason?.message ?? "";
  if (msg.includes("MetaMask") || msg.includes("chrome-extension")) {
    event.preventDefault();
  }
});

createRoot(document.getElementById("root")!).render(<App />);

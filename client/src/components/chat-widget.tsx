import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

const WIDGET_SCRIPT_ID = "marcin-chat-widget-script";
const WIDGET_SRC = "https://parish-chat.replit.app/api/widget.js";
const WIDGET_PARISH = "1";
const WIDGET_KEY = "f8278e1351c3832b280b3c483a9c21277e012ed0dcdcc6fea140935146d00f67";
const WIDGET_API = "https://parish-chat.replit.app";

async function apiFetch(url: string) {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error("fetch failed");
  return res.json();
}

function removeWidget() {
  const existing = document.getElementById(WIDGET_SCRIPT_ID);
  if (existing) existing.remove();

  const containers = document.querySelectorAll('[id^="marcin-"]');
  containers.forEach((el) => el.remove());

  const allDivs = document.querySelectorAll("div");
  allDivs.forEach((el) => {
    if (el.shadowRoot) {
      const shadow = el.shadowRoot;
      if (shadow.querySelector(".marcin-trigger") || shadow.querySelector(".marcin-chat")) {
        el.remove();
      }
    }
  });
}

function injectWidget() {
  if (document.getElementById(WIDGET_SCRIPT_ID)) return;

  const script = document.createElement("script");
  script.id = WIDGET_SCRIPT_ID;
  script.src = WIDGET_SRC;
  script.setAttribute("data-parish", WIDGET_PARISH);
  script.setAttribute("data-key", WIDGET_KEY);
  script.setAttribute("data-api", WIDGET_API);
  script.setAttribute("data-marcin-widget", "true");
  document.body.appendChild(script);
}

export function ChatWidget() {
  const { data } = useQuery<{ value: string | null }>({
    queryKey: ["admin-setting", "chat_widget_enabled"],
    queryFn: () => apiFetch("/api/admin/settings/chat_widget_enabled"),
  });

  const enabled = data?.value !== "false";

  useEffect(() => {
    if (enabled) {
      injectWidget();
    } else {
      removeWidget();
    }
    return () => {
      removeWidget();
    };
  }, [enabled]);

  return null;
}

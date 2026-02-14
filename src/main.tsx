import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initSentry } from "./lib/sentry";
import { initPostHog } from "./lib/posthog";

// Initialize before render
initSentry();
initPostHog();

createRoot(document.getElementById("root")!).render(<App />);


  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import { PilotDataProvider } from "./data-access/PilotDataProvider.tsx";
  import "./styles/index.css";

  createRoot(document.getElementById("root")!).render(
    <PilotDataProvider>
      <App />
    </PilotDataProvider>,
  );
  

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Placeholder } from "./Placeholder";
import "./placeholder.css";

const root = document.getElementById("root");
if (!root) throw new Error("Missing #root element");

createRoot(root).render(
  <StrictMode>
    <Placeholder />
  </StrictMode>,
);

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";
import "./index.css";
import Home from "./pages/Home/index.tsx";
import Test from "./pages/Test/index.tsx";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <Routes>
      <Route path="/mini-fabric-whiteboard/test" element={<Test />} />
      <Route path="*" element={<Home />} />
    </Routes>
  </BrowserRouter>
);

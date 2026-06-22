import { Route, Routes } from "react-router-dom";
import { AlertsPage } from "./pages/AlertsPage";
import { BuildPage } from "./pages/BuildPage";
import { FarmPage } from "./pages/FarmPage";
import { Home } from "./pages/Home";
import { ItemPage } from "./pages/ItemPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/item/:slug" element={<ItemPage />} />
      <Route path="/farm" element={<FarmPage />} />
      <Route path="/build" element={<BuildPage />} />
      <Route path="/alerts" element={<AlertsPage />} />
    </Routes>
  );
}

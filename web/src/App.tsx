import { Route, Routes } from "react-router-dom";
import { Home } from "./pages/Home";
import { ItemPage } from "./pages/ItemPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/item/:slug" element={<ItemPage />} />
    </Routes>
  );
}

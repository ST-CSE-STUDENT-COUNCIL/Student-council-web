import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Events from "./pages/Events";
import Notice from "./pages/Notice";
import Intro from "./pages/Intro";
import WellBeing from "./pages/WellBeing";
import MyPage from "./pages/MyPage";
import Clubs from "./pages/Clubs";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/mypage" element={<MyPage />} />
      <Route path="/events" element={<Events />} />
      <Route path="/notice" element={<Notice />} />
      <Route path="/intro" element={<Intro />} />
      <Route path="/well-being" element={<WellBeing />} />
      <Route path="/clubs" element={<Clubs />} />
    </Routes>
  );
}

export default App;

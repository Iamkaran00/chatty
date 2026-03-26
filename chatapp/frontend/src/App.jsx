import { Navbar } from "./components/Navbar";
import { SettingsPage } from "./pages/SettingsPage";
import { Routes, Route, NavLink } from "react-router-dom";
import SignUpPage from "./pages/SignUpPage";
import { HomePage } from "./pages/HomePage";
import { ProfilePage } from "./pages/ProfilePage";
import { useAuthStore } from "./store/useAuthStore";
import { useEffect } from "react";
import { Loader } from 'lucide-react';
import { Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import LoginPage from "./pages/LoginPage";
import { useThemeStore } from "./store/useThemeStore";
import Wallpaper from "./pages/Wallpaper";
import TypingRace from "./games/TypingRace";
import Whiteboard from "./pages/Whiteboard";
import WhiteboardInvite from './pages/WhiteboarInvite';
function App() {
  const { authUser, checkAuth, isCheckingAuth } = useAuthStore();
  const { theme } = useThemeStore();
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);


  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader size={40} className="animate-spin" />
      </div>
    );
  }

  return (
    <div data-theme={theme}>
      <Navbar />
      <Routes>
        <Route path="/" element={authUser ? <HomePage /> : <Navigate to="/login" />} />
        <Route path="/signup" element={!authUser ? <SignUpPage /> : <Navigate to="/" />} />
        <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to="/" />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/showwallpaper" element={<Wallpaper />} />
        <Route path='/whiteboard-invite' element={<WhiteboardInvite />} />
        <Route path='/whiteboard/:roomId' element={<Whiteboard />} />
        <Route path='/race/:roomId' element={<TypingRace />} />
      </Routes>
      <Toaster />
    </div>
  );
}

export default App

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/useAuthStore';
import SplashScreen from './components/screens/SplashScreen';
import LoginScreen from './components/screens/LoginScreen';
import MainMenuScreen from './components/screens/MainMenuScreen';
import LobbyScreen from './components/screens/LobbyScreen';
import GameScreen from './components/screens/GameScreen';
import ResultsScreen from './components/screens/ResultsScreen';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SplashScreen />} />
        <Route path="/login" element={<LoginScreen />} />
        <Route
          path="/menu"
          element={<RequireAuth><MainMenuScreen /></RequireAuth>}
        />
        <Route
          path="/lobby"
          element={<RequireAuth><LobbyScreen /></RequireAuth>}
        />
        <Route
          path="/game"
          element={<RequireAuth><GameScreen /></RequireAuth>}
        />
        <Route
          path="/results"
          element={<RequireAuth><ResultsScreen /></RequireAuth>}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

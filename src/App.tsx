import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Study from './pages/Study';
import Reflections from './pages/Reflections';
import Journey from './pages/Journey';
import { motion, AnimatePresence } from 'motion/react';

function AnimatedRoutes() {
  const location = useLocation();
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="h-screen w-screen flex items-center justify-center bg-[#05070A]">
      <div className="animate-pulse flex flex-col items-center gap-6">
        <h1 className="text-4xl font-sans font-black text-white uppercase tracking-[0.3em]">Noor</h1>
        <div className="h-[2px] w-48 bg-white/5 rounded-full overflow-hidden">
          <div className="h-full bg-brand-emerald animate-[loading_1.5s_ease-in-out_infinite]" style={{ width: '40%' }}></div>
        </div>
      </div>
    </div>
  );

  return (
    <AnimatePresence mode="wait">
      <Routes location={location}>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="study" element={<Study />} />
          <Route path="reflections" element={<Reflections />} />
          <Route path="journey" element={<Journey />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AnimatedRoutes />
      </Router>
    </AuthProvider>
  );
}

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Inscriptions from './pages/Inscriptions';
import Bilans from './pages/Bilans';
import Groups from './pages/Groups';
import Conge from './pages/Conge';
import BacNotes from './pages/BacNotes';
import Timetable from './pages/Timetable';
import ExamGrades from './pages/ExamGrades';
import CCGrades from './pages/CCGrades';
import Layout from './components/Layout';

function PrivateRoute({ children }) {
  const { auth } = useAuth();
  return auth ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { auth } = useAuth();
  return auth ? <Navigate to="/" replace /> : children;
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
              <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
                <Route index element={<Dashboard />} />
                <Route path="profile" element={<Profile />} />
                <Route path="inscriptions" element={<Inscriptions />} />
                <Route path="bilans" element={<Bilans />} />
                <Route path="groups" element={<Groups />} />
                <Route path="conge" element={<Conge />} />
                <Route path="bacnotes" element={<BacNotes />} />
                <Route path="timetable" element={<Timetable />} />
                <Route path="examgrades" element={<ExamGrades />} />
                <Route path="ccgrades" element={<CCGrades />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

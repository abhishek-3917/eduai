import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store, useAppSelector } from './store';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Assessments from './pages/Assessments';
import Roadmap from './pages/Roadmap';
import Tutor from './pages/Tutor';
import Planner from './pages/Planner';
import Career from './pages/Career';
import Notes from './pages/Notes';
import Analytics from './pages/Analytics';
import Profile from './pages/Profile';
import CreateAssessment from './pages/CreateAssessment';
import Courses from './pages/Courses';

import DashboardLayout from './components/DashboardLayout';

// Guard component checking JWT Auth status
function PrivateRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}

// Public Route Guard (prevents logged-in users from seeing login/register screen)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Landing */}
        <Route path="/" element={<Landing />} />

        {/* Guest Auth */}
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

        {/* Authenticated Dashboard Interfaces */}
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />

        {/* Student Specific Routes */}
        <Route path="/assessments" element={<PrivateRoute allowedRoles={['student']}><Assessments /></PrivateRoute>} />
        <Route path="/roadmap" element={<PrivateRoute allowedRoles={['student']}><Roadmap /></PrivateRoute>} />
        <Route path="/tutor" element={<PrivateRoute allowedRoles={['student']}><Tutor /></PrivateRoute>} />
        <Route path="/planner" element={<PrivateRoute allowedRoles={['student']}><Planner /></PrivateRoute>} />
        <Route path="/career" element={<PrivateRoute allowedRoles={['student']}><Career /></PrivateRoute>} />
        <Route path="/notes" element={<PrivateRoute allowedRoles={['student']}><Notes /></PrivateRoute>} />
        <Route path="/analytics" element={<PrivateRoute allowedRoles={['student']}><Analytics /></PrivateRoute>} />

        {/* Teacher/Admin Specific Routes */}
        <Route path="/courses" element={<PrivateRoute allowedRoles={['teacher', 'admin']}><Courses /></PrivateRoute>} />
        <Route path="/create-assessment" element={<PrivateRoute allowedRoles={['teacher', 'admin']}><CreateAssessment /></PrivateRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <AppRoutes />
    </Provider>
  );
}

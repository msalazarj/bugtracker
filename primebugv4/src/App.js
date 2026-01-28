// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// --- Páginas de Autenticación ---
import Login from './pages/Auth/Login.jsx';
import Register from './pages/Auth/Register.jsx';
import ForgotPassword from './pages/Auth/ForgotPassword.jsx';
import UpdatePassword from './pages/Auth/UpdatePassword.jsx';

// --- Layout Principal ---
import MainLayout from './layouts/MainLayout.jsx';

// --- Páginas de la Aplicación ---
import Dashboard from './pages/Dashboard/Dashboard.jsx';
import ProjectsList from './pages/Projects/ProjectsList.jsx';
import ProjectCreate from './pages/Projects/ProjectCreate.jsx';
import ProjectDetail from './pages/Projects/ProjectDetail.jsx'; // This will act as a layout
import ProjectEdit from './pages/Projects/ProjectEdit.jsx';
import ProjectMembers from './pages/Projects/ProjectMembers.jsx';
import BugList from './pages/Bugs/BugList.jsx';
import BugCreate from './pages/Bugs/BugCreate.jsx';
import BugDetail from './pages/Bugs/BugDetail.jsx';
import UserProfile from './pages/UserProfile/UserProfile.jsx';
import MemberList from './pages/Members/MemberList.jsx';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
        <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Validando sesión segura...</p>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* --- RUTAS PÚBLICAS --- */}
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Register />} />
          <Route path="/recuperar-clave" element={<ForgotPassword />} />
          <Route path="/actualizar-clave" element={<UpdatePassword />} />

          {/* --- RUTAS PROTEGIDAS (Envueltas en ProtectedRoute y MainLayout) --- */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="perfil" element={<UserProfile />} />
            <Route path="miembros" element={<MemberList />} />

            {/* Gestión de Proyectos */}
            <Route path="proyectos" element={<ProjectsList />} />
            <Route path="proyectos/crear" element={<ProjectCreate />} />
            <Route path="proyectos/editar/:projectId" element={<ProjectEdit />} />
            
            {/* --- ANIDAMIENTO DE RUTAS DEL PROYECTO --- */}
            {/* ProjectDetail ahora actúa como un Layout para sus rutas hijas */}
            <Route path="proyectos/:projectId" element={<ProjectDetail />}>
              {/* La ruta 'index' se renderiza por defecto dentro del Outlet de ProjectDetail */}
              {/* Por ahora apunta a la lista de issues, que es lo más común */}
              <Route index element={<Navigate to="issues" replace />} />
              <Route path="issues" element={<BugList />} />
              <Route path="miembros" element={<ProjectMembers />} />
            </Route>
            
            {/* Gestión de Issues (Bugs) - Estas son páginas completas, no anidadas */}
            <Route path="proyectos/:projectId/issues/crear" element={<BugCreate />} />
            <Route path="proyectos/:projectId/issues/editar/:bugId" element={<BugCreate />} />
            <Route path="proyectos/:projectId/issues/:bugId" element={<BugDetail />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;

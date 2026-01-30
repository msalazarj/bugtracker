// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
import ProjectDetail from './pages/Projects/ProjectDetail.jsx';
import ProjectEdit from './pages/Projects/ProjectEdit.jsx';
import ProjectMembers from './pages/Projects/ProjectMembers.jsx';
import ProjectIssues from './pages/Projects/ProjectIssues.jsx';
import ProjectDocumentation from './pages/Projects/ProjectDocumentation.jsx'; // <-- NUEVO
import BugList from './pages/Bugs/BugList.jsx';
import BugCreate from './pages/Bugs/BugCreate.jsx';
import BugDetail from './pages/Bugs/BugDetail.jsx';
import UserProfile from './pages/UserProfile/UserProfile.jsx';
import TeamList from './pages/Teams/TeamList.jsx';
import TeamCreate from './pages/Teams/TeamCreate.jsx';
import TeamDetail from './pages/Teams/TeamDetail.jsx';
import TeamMembers from './pages/Teams/TeamMembers.jsx';

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

          {/* --- RUTAS PROTEGIDAS (DENTRO DEL LAYOUT PRINCIPAL) --- */}
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
            
            {/* Gestión Global de Bugs */}
            <Route path="bugs" element={<BugList />} />
            <Route path="bugs/:bugId" element={<BugDetail />} />
            
            {/* Gestión de Equipos */}
            <Route path="equipos" element={<TeamList />} />
            <Route path="equipos/crear" element={<TeamCreate />} />
            <Route path="equipos/:teamId" element={<TeamDetail />} />
            <Route path="equipos/:teamId/miembros" element={<TeamMembers />} />

            {/* Gestión de Proyectos */}
            <Route path="proyectos" element={<ProjectsList />} />
            <Route path="proyectos/crear" element={<ProjectCreate />} />
            
            <Route path="proyectos/:projectId" element={<Navigate to="detalles" replace />} />
            <Route path="proyectos/:projectId/detalles" element={<ProjectDetail />} />
            <Route path="proyectos/:projectId/bugs" element={<ProjectIssues />} />
            <Route path="proyectos/:projectId/miembros" element={<ProjectMembers />} />
            <Route path="proyectos/:projectId/documentacion" element={<ProjectDocumentation />} /> {/* <-- NUEVA RUTA */}
            
            {/* Rutas de acción de proyecto */}
            <Route path="proyectos/:projectId/editar" element={<ProjectEdit />} />
            <Route path="proyectos/:projectId/crear-bug" element={<BugCreate />} />

          </Route>

          {/* Ruta comodín para cualquier otra URL */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;

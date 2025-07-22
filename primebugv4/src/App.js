// src/App.js - VERSIÓN FINAL CON RUTA DE EDICIÓN DE EQUIPO
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
// COMENTARIO: Se importa el nuevo componente para editar proyectos.
import ProjectEdit from './pages/Projects/ProjectEdit.jsx';
import ProjectMembers from './pages/Projects/ProjectMembers.jsx';
import BugList from './pages/Bugs/BugList.jsx';
import BugCreate from './pages/Bugs/BugCreate.jsx';
import BugDetail from './pages/Bugs/BugDetail.jsx';
import UserProfile from './pages/UserProfile/UserProfile.jsx';
import TeamList from './pages/Teams/TeamList.jsx';
import TeamCreate from './pages/Teams/TeamCreate.jsx';
import TeamDetail from './pages/Teams/TeamDetail.jsx';
import TeamEdit from './pages/Teams/TeamEdit.jsx';
import MemberList from './pages/Members/MemberList.jsx';

// --- Componente de ejemplo para rutas en desarrollo ---
const PlaceholderPage = ({ title }) => (
    <div className="p-4 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p>Esta es una página de ejemplo. El contenido se construirá en una etapa posterior.</p>
    </div>
);

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen text-xl">Cargando...</div>;
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

          {/* --- RUTAS PROTEGIDAS Y ANIDADAS --- */}
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
            
            {/* --- Rutas de Equipos --- */}
            <Route path="equipos" element={<TeamList />} />
            <Route path="equipos/crear" element={<TeamCreate />} />
            {/* COMENTARIO: Se añade la nueva ruta para editar equipos. */}
            <Route path="equipos/editar/:id" element={<TeamEdit />} />
            <Route path="equipos/:id" element={<TeamDetail />} />
            <Route path="equipos/:id/miembros" element={<PlaceholderPage title="Gestionar Miembros del Equipo" />} />
            
            <Route path="miembros" element={<MemberList />} />

            {/* --- Rutas de Proyectos y Bugs anidadas --- */}
            <Route path="proyectos" element={<ProjectsList />} />
            <Route path="proyectos/crear" element={<ProjectCreate />} />
            {/* COMENTARIO: Se añade la nueva ruta para editar proyectos. */}
            <Route path="proyectos/editar/:projectId" element={<ProjectEdit />} />
            {/* Renombrado :id a :projectId por claridad */}
            <Route path="proyectos/:projectId" element={<ProjectDetail />} />
            <Route path="proyectos/:projectId/miembros" element={<ProjectMembers />} />
            
            {/* Rutas de Issues (Bugs) anidadas */}
            <Route path="proyectos/:projectId/issues" element={<BugList />} />
            <Route path="proyectos/:projectId/issues/crear" element={<BugCreate />} />
            <Route path="proyectos/:projectId/issues/editar/:bugId" element={<BugCreate />} />
            <Route path="proyectos/:projectId/issues/:bugId" element={<BugDetail />} />
            
            {/* --- COMENTARIO: Las siguientes rutas de bugs de nivel superior son incorrectas y se eliminan --- */}
            {/* <Route path="bugs" element={<BugList />} />
            <Route path="bugs/crear" element={<BugCreate />} />
            <Route path="bugs/:id" element={<BugDetail />} />
            <Route path="bugs/editar/:id" element={<BugCreate />} />
            */}

            <Route path="perfil" element={<UserProfile />} />
          </Route>

          {/* --- RUTA COMODÍN (Catch-all) --- */}
          <Route 
            path="*" 
            element={
                <Navigate to="/dashboard" replace />
            } 
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
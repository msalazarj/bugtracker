// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';

// Layouts
import MainLayout from './layouts/MainLayout.jsx';

// Páginas de autenticación (nombres corregidos)
import Login from './pages/Auth/Login.jsx';
import Register from './pages/Auth/Register.jsx';

// Páginas principales
import Dashboard from './pages/Dashboard/Dashboard.jsx';
import ProjectsList from './pages/Projects/ProjectsList.jsx';
import ProjectCreate from './pages/Projects/ProjectCreate.jsx';
import ProjectDetail from './pages/Projects/ProjectDetail.jsx';
import ProjectMembers from './pages/Projects/ProjectMembers.jsx';
import ProjectIssues from './pages/Projects/ProjectIssues.jsx';
import BugList from './pages/Bugs/BugList.jsx';
import BugCreate from './pages/Bugs/BugCreate.jsx';
import TeamList from './pages/Teams/TeamList.jsx';
import TeamCreate from './pages/Teams/TeamCreate.jsx';
import TeamDetail from './pages/Teams/TeamDetail.jsx';
import TeamMembers from './pages/Teams/TeamMembers.jsx';
import MemberList from './pages/Members/MemberList.jsx'; // Añadido para la nueva ruta

// --- Componente de Carga Global ---
const FullScreenLoader = () => (
    <div className="fixed inset-0 bg-slate-900 flex items-center justify-center z-50">
        <div className="text-center text-white">
            <p className="text-2xl font-bold">Cargando PrimeBug...</p>
            <p className="mt-2">Preparando el entorno de trabajo.</p>
        </div>
    </div>
);

// --- Componente para Proteger Rutas que Requieren un Equipo ---
const TeamProtectedRoute = () => {
    const { hasTeam, loading } = useAuth();

    if (loading) {
        return <FullScreenLoader />;
    }

    // Si el usuario no tiene equipo, se le redirige al dashboard,
    // que le mostrará el panel de bienvenida para crear uno.
    if (!hasTeam) {
        return <Navigate to="/dashboard" replace />;
    }

    // Si tiene equipo, se renderiza la ruta solicitada.
    return <Outlet />;
};

// --- Componente Principal de la Aplicación ---
const AppContent = () => {
    const { user, loading } = useAuth();
    
    if (loading) {
        return <FullScreenLoader />;
    }

    return (
        <Routes>
            {/* Rutas Públicas de Autenticación */}
            <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
            <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" />} />
            
            {/* Contenedor de Rutas Protegidas (Requieren estar logueado) */}
            <Route 
                path="/*" 
                element={user ? <MainLayout /> : <Navigate to="/login" replace />}
            >
                {/* El índice redirige al dashboard */}
                <Route index element={<Navigate to="/dashboard" replace />} />

                {/* Rutas accesibles para CUALQUIER usuario logueado */}
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="equipos" element={<TeamList />} />
                <Route path="equipos/crear" element={<TeamCreate />} />
                <Route path="equipos/:teamId" element={<TeamDetail />} />
                <Route path="equipos/:teamId/miembros" element={<TeamMembers />} />

                {/* --- Grupo de Rutas que Requieren un Equipo --- */}
                <Route element={<TeamProtectedRoute />}>
                    <Route path="miembros" element={<MemberList />} />
                    <Route path="proyectos" element={<ProjectsList />} />
                    <Route path="proyectos/crear" element={<ProjectCreate />} />
                    <Route path="proyectos/:projectId" element={<ProjectDetail />} />
                    <Route path="proyectos/:projectId/miembros" element={<ProjectMembers />} />
                    <Route path="proyectos/:projectId/issues" element={<ProjectIssues />} />
                    <Route path="proyectos/:projectId/crear-bug" element={<BugCreate />} />
                    <Route path="bugs" element={<BugList />} />
                </Route>
                
                {/* Ruta comodín para cualquier otra URL, redirige al dashboard */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
        </Routes>
    );
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
};

export default App;

import React from 'react';

import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';

import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';

import MainLayout from './layouts/MainLayout.jsx';



// --- PÁGINAS --- //



// Auth

import Login from './pages/Auth/Login.jsx';

import Register from './pages/Auth/Register.jsx';

import ResetPassword from './pages/Auth/ResetPassword.jsx';



// Dashboard

import Dashboard from './pages/Dashboard/Dashboard.jsx';



// Perfil

import UserProfile from './pages/User/UserProfile.jsx';



// Equipos

import TeamList from './pages/Teams/TeamList.jsx';

import TeamCreate from './pages/Teams/TeamCreate.jsx';

import TeamMembers from './pages/Teams/TeamMembers.jsx'; // Eliminamos TeamDetail



// Proyectosserá q

import ProjectsList from './pages/Projects/ProjectsList.jsx';

import ProjectCreate from './pages/Projects/ProjectCreate.jsx';

import ProjectDetail from './pages/Projects/ProjectDetail.jsx';

import ProjectMembers from './pages/Projects/ProjectMembers.jsx';

import ProjectDocumentation from './pages/Projects/ProjectDocumentation.jsx';



// Bugs

import BugList from './pages/Bugs/BugList.jsx';

import BugCreate from './pages/Bugs/BugCreate.jsx';

import BugDetail from './pages/Bugs/BugDetail.jsx';



// Reportes

import Reports from './pages/Reports/Reports.jsx';



// Componente de Carga Global

const FullScreenLoader = () => (

    <div className="fixed inset-0 bg-slate-50 flex flex-col items-center justify-center z-50">

        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>

        <div className="text-slate-500 font-medium">Cargando PrimeBug...</div>

    </div>

);



// Guardián de Ruta: Requiere tener equipo seleccionado

const TeamProtectedRoute = () => {

    const { hasTeam, loading } = useAuth();

   

    if (loading) return <FullScreenLoader />;

   

    // Si no tiene equipo, redirigir a la lista de equipos

    if (!hasTeam) return <Navigate to="/equipos" replace />;

   

    return <Outlet />;

};



const AppContent = () => {

    const { user, loading } = useAuth();

   

    if (loading) return <FullScreenLoader />;



    return (

        <Routes>

            {/* --- RUTAS PÚBLICAS --- */}

            <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />

            <Route path="/registro" element={!user ? <Register /> : <Navigate to="/dashboard" />} />

            <Route path="/reset-password" element={<ResetPassword />} />

           

            {/* --- RUTAS PRIVADAS (Layout Principal) --- */}

            <Route path="/*" element={user ? <MainLayout /> : <Navigate to="/login" replace />}>

               

                {/* Redirección inicial */}

                <Route index element={<Navigate to="/dashboard" replace />} />

               

                <Route path="dashboard" element={<Dashboard />} />

               

                {/* Perfil de Usuario */}

                <Route path="perfil" element={<UserProfile />} />

               

                {/* --- MÓDULO EQUIPOS --- */}

                <Route path="equipos" element={<TeamList />} />

                <Route path="equipos/crear" element={<TeamCreate />} />

                {/* CORRECCIÓN: Se eliminó la ruta "equipos/:teamId" redundante */}

                <Route path="equipos/:teamId/miembros" element={<TeamMembers />} />



                {/* --- RUTAS QUE REQUIEREN UN EQUIPO ACTIVO --- */}

                <Route element={<TeamProtectedRoute />}>

                   

                    {/* Reportes Globales */}

                    <Route path="reportes" element={<Reports />} />

                   

                    {/* Proyectos */}

                    <Route path="proyectos" element={<ProjectsList />} />

                    <Route path="proyectos/crear" element={<ProjectCreate />} />



                    {/* Contexto de un Proyecto Específico */}

                    <Route path="proyectos/:projectId" element={<ProjectDetail />} />

                    <Route path="proyectos/:projectId/miembros" element={<ProjectMembers />} />

                    <Route path="proyectos/:projectId/documentacion" element={<ProjectDocumentation />} />

                   

                    {/* Gestión de Bugs */}

                    <Route path="proyectos/:projectId" element={<Navigate to="bugs" replace />} />

                   

                    <Route path="proyectos/:projectId/bugs" element={<BugList />} />

                    <Route path="proyectos/:projectId/bugs/crear" element={<BugCreate />} />

                    <Route path="proyectos/:projectId/bugs/:bugId" element={<BugDetail />} />

                </Route>

               

                {/* Catch-all */}

                <Route path="*" element={<Navigate to="/dashboard" replace />} />

            </Route>

        </Routes>

    );

};



const App = () => (

    <Router>

      <AuthProvider>

        <AppContent />

      </AuthProvider>

    </Router>

);



export default App;
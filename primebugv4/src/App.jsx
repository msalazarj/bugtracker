import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import MainLayout from './layouts/MainLayout.jsx';

// --- PÁGINAS (Lazy Loading) --- //

// Auth
const Login = lazy(() => import('./pages/Auth/Login.jsx'));
const Register = lazy(() => import('./pages/Auth/Register.jsx'));
const ResetPassword = lazy(() => import('./pages/Auth/ResetPassword.jsx'));

// Dashboard
const Dashboard = lazy(() => import('./pages/Dashboard/Dashboard.jsx'));

// Perfil
const UserProfile = lazy(() => import('./pages/User/UserProfile.jsx'));

// Equipos
const TeamList = lazy(() => import('./pages/Teams/TeamList.jsx'));
const TeamCreate = lazy(() => import('./pages/Teams/TeamCreate.jsx'));
const TeamMembers = lazy(() => import('./pages/Teams/TeamMembers.jsx'));

// Proyectos
const ProjectsList = lazy(() => import('./pages/Projects/ProjectsList.jsx'));
const ProjectCreate = lazy(() => import('./pages/Projects/ProjectCreate.jsx'));
const ProjectDetail = lazy(() => import('./pages/Projects/ProjectDetail.jsx'));
const ProjectMembers = lazy(() => import('./pages/Projects/ProjectMembers.jsx'));
const ProjectDocumentation = lazy(() => import('./pages/Projects/ProjectDocumentation.jsx'));

// Bugs
const BugList = lazy(() => import('./pages/Bugs/BugList.jsx'));
const BugCreate = lazy(() => import('./pages/Bugs/BugCreate.jsx'));
const BugDetail = lazy(() => import('./pages/Bugs/BugDetail.jsx'));

// Reportes
const Reports = lazy(() => import('./pages/Reports/Reports.jsx'));

// Componente de Carga Global
const FullScreenLoader = () => (
    <div className="fixed inset-0 bg-slate-50 flex flex-col items-center justify-center z-50">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <div className="text-slate-500 font-medium">Cargando PrimeBug...</div>
    </div>
);

// Componente de Carga para transiciones internas (más ligero)
const PageLoader = () => (
    <div className="w-full h-full min-h-[400px] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
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
        <Suspense fallback={<FullScreenLoader />}>
            <Routes>
                {/* --- RUTAS PÚBLICAS --- */}
                <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
                <Route path="/registro" element={!user ? <Register /> : <Navigate to="/dashboard" />} />
                <Route path="/reset-password" element={<ResetPassword />} />
            
                {/* --- RUTAS PRIVADAS (Layout Principal) --- */}
                <Route path="/*" element={user ? <MainLayout /> : <Navigate to="/login" replace />}>
                    
                    {/* Anidamos otro Suspense aquí para que el layout se mantenga mientras carga la página hija */}
                    <Route element={<Suspense fallback={<PageLoader />}> <Outlet /> </Suspense>}>
                        
                        {/* Redirección inicial */}
                        <Route index element={<Navigate to="/dashboard" replace />} />
                    
                        <Route path="dashboard" element={<Dashboard />} />
                    
                        {/* Perfil de Usuario */}
                        <Route path="perfil" element={<UserProfile />} />
                    
                        {/* --- MÓDULO EQUIPOS --- */}
                        <Route path="equipos" element={<TeamList />} />
                        <Route path="equipos/crear" element={<TeamCreate />} />
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
                </Route>
            </Routes>
        </Suspense>
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
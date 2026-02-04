// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';

// Layouts
import MainLayout from './layouts/MainLayout.jsx';

// Páginas
import Login from './pages/Auth/Login.jsx';
import Register from './pages/Auth/Register.jsx';
import Dashboard from './pages/Dashboard/Dashboard.jsx';
import ProjectsList from './pages/Projects/ProjectsList.jsx';
import ProjectCreate from './pages/Projects/ProjectCreate.jsx';
import ProjectDetail from './pages/Projects/ProjectDetail.jsx';
import TeamCreate from './pages/Teams/TeamCreate.jsx';
import TeamDetail from './pages/Teams/TeamDetail.jsx';
import TeamList from './pages/Teams/TeamList.jsx';
import MemberList from './pages/Members/MemberList.jsx';

// --- Componente de Carga Global ---
const FullScreenLoader = () => (
    <div className="fixed inset-0 bg-slate-900 flex items-center justify-center z-50">
        <div className="text-center text-white">
            <p className="text-2xl font-bold">Cargando PrimeBug...</p>
            <p className="mt-2">Preparando el entorno de trabajo.</p>
        </div>
    </div>
);

// --- COMPONENTE DE REDIRECCIÓN A "MI EQUIPO" (NUEVO) ---
const MyTeamRedirect = () => {
    const { profile, loading, hasTeam } = useAuth();

    if (loading) {
        return <FullScreenLoader />;
    }

    // Si el usuario tiene un equipo, lo redirige a la página de detalle de su equipo.
    if (hasTeam && profile?.teamId) {
        return <Navigate to={`/equipos/${profile.teamId}`} replace />;
    }

    // Si no tiene equipo, le permite ver la página para crear uno.
    return <TeamList />;
};


// --- Componente para Proteger Rutas que Requieren un Equipo ---
const TeamProtectedRoute = () => {
    const { hasTeam, loading } = useAuth();

    if (loading) {
        return <FullScreenLoader />;
    }

    if (!hasTeam) {
        return <Navigate to="/dashboard" replace />;
    }

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
            <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
            <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" />} />
            
            <Route path="/*" element={user ? <MainLayout /> : <Navigate to="/login" replace />}>
                <Route index element={<Navigate to="/dashboard" replace />} />

                <Route path="dashboard" element={<Dashboard />} />
                
                {/* --- RUTA CORREGIDA PARA "MI EQUIPO" --- */}
                <Route path="equipos" element={<MyTeamRedirect />} />
                
                <Route path="equipos/crear" element={<TeamCreate />} />
                <Route path="equipos/:teamId" element={<TeamDetail />} />

                <Route element={<TeamProtectedRoute />}>
                    <Route path="miembros" element={<MemberList />} />
                    <Route path="proyectos" element={<ProjectsList />} />
                    <Route path="proyectos/crear" element={<ProjectCreate />} />
                    <Route path="proyectos/:projectId" element={<ProjectDetail />} />
                </Route>
                
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

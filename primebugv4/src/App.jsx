// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';

// Layouts
import MainLayout from './layouts/MainLayout.jsx';

// Páginas de autenticación
import SignIn from './pages/Auth/SignIn.jsx';
import SignUp from './pages/Auth/SignUp.jsx';

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

// --- Componente de Carga Global ---
const FullScreenLoader = () => (
    <div className="fixed inset-0 bg-slate-900 flex items-center justify-center z-50">
        <div className="text-center text-white">
            <p className="text-2xl font-bold">Cargando PrimeBug...</p>
            <p className="mt-2">Iniciando sesión y preparando el entorno.</p>
        </div>
    </div>
);

// --- Componente Robusto para Proteger Rutas ---
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();

    // Mientras el estado de autenticación se está verificando, mostrar un loader global
    if (loading) {
        return <FullScreenLoader />;
    }

    // Si la verificación terminó y no está autenticado, redirigir al login
    if (!isAuthenticated) {
        return <Navigate to="/signin" replace />;
    }

    // Si la verificación terminó y está autenticado, renderizar el contenido protegido
    return children;
};

// --- Componente Principal de la Aplicación ---
const AppContent = () => {
    const { loading, isAuthenticated } = useAuth();
    
    // El estado de carga inicial se maneja en el ProtectedRoute,
    // pero este chequeo puede ser útil para rutas públicas si las hubiera.
    if (loading) {
        return <FullScreenLoader />;
    }

    return (
        <Routes>
            {/* Rutas Públicas */}
            <Route path="/signin" element={!isAuthenticated ? <SignIn /> : <Navigate to="/" />} />
            <Route path="/signup" element={!isAuthenticated ? <SignUp /> : <Navigate to="/" />} />
            
            {/* Rutas Protegidas */}
            <Route 
                path="/*" 
                element={
                    <ProtectedRoute>
                        <MainLayout />
                    </ProtectedRoute>
                }
            >
                {/* Todas las rutas anidadas bajo MainLayout */}
                <Route index element={<Dashboard />} />
                <Route path="proyectos" element={<ProjectsList />} />
                <Route path="proyectos/crear" element={<ProjectCreate />} />
                <Route path="proyectos/:projectId" element={<ProjectDetail />} />
                <Route path="proyectos/:projectId/miembros" element={<ProjectMembers />} />
                <Route path="proyectos/:projectId/issues" element={<ProjectIssues />} />
                <Route path="proyectos/:projectId/crear-bug" element={<BugCreate />} />
                <Route path="bugs" element={<BugList />} />
                <Route path="equipos" element={<TeamList />} />
                <Route path="equipos/crear" element={<TeamCreate />} />
                <Route path="equipos/:teamId" element={<TeamDetail />} />
                <Route path="equipos/:teamId/miembros" element={<TeamMembers />} />
                
                {/* El comodín debe estar dentro del layout protegido */}
                <Route path="*" element={<Navigate to="/" replace />} />
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

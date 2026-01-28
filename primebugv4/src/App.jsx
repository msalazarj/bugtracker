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
import ProjectIssues from './pages/Projects/ProjectIssues.jsx'; // Importado

import BugList from './pages/Bugs/BugList.jsx';
import BugCreate from './pages/Bugs/BugCreate.jsx'; // Lo mantenemos para la ruta específica

import TeamList from './pages/Teams/TeamList.jsx';
import TeamCreate from './pages/Teams/TeamCreate.jsx';
import TeamDetail from './pages/Teams/TeamDetail.jsx';
import TeamMembers from './pages/Teams/TeamMembers.jsx';

// Componente para proteger rutas
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/signin" />;
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          
          <Route 
            path="/" 
            element={<ProtectedRoute><MainLayout /></ProtectedRoute>}
          >
            <Route index element={<Dashboard />} />
            
            {/* Rutas de Proyectos */}
            <Route path="proyectos" element={<ProjectsList />} />
            <Route path="proyectos/crear" element={<ProjectCreate />} />
            <Route path="proyectos/:projectId" element={<ProjectDetail />} />
            <Route path="proyectos/:projectId/miembros" element={<ProjectMembers />} />
            
            {/* NUEVA RUTA: Lista de Issues de un Proyecto */}
            <Route path="proyectos/:projectId/issues" element={<ProjectIssues />} />

            {/* RUTA CORREGIDA: Crear un Bug dentro de un Proyecto */}
            <Route path="proyectos/:projectId/crear-bug" element={<BugCreate />} />

            {/* Listado general de todos los bugs (si se necesita) */}
            <Route path="bugs" element={<BugList />} />

            {/* Rutas de Equipos */}
            <Route path="equipos" element={<TeamList />} />
            <Route path="equipos/crear" element={<TeamCreate />} />
            <Route path="equipos/:teamId" element={<TeamDetail />} />
            <Route path="equipos/:teamId/miembros" element={<TeamMembers />} />

            {/* Redirección por defecto si la ruta no existe */}
            <Route path="*" element={<Navigate to="/" />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;

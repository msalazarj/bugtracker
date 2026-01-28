// src/pages/Bugs/BugList.jsx
import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { Link } from 'react-router-dom';
import { FaPlus, FaBug } from 'react-icons/fa';

const BugList = () => {
  const [bugs, setBugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const fetchBugs = async () => {
        setLoading(true);
        try {
            // 1. Obtener los proyectos del usuario.
            const projectsQuery = query(collection(db, "projects"), where("members", "array-contains", user.uid));
            const projectsSnap = await getDocs(projectsQuery);
            const projectIds = projectsSnap.docs.map(doc => doc.id);

            if (projectIds.length === 0) {
                // Si el usuario no tiene proyectos, no hay bugs que mostrar.
                setBugs([]);
                setLoading(false);
                return;
            }

            // 2. Escuchar los bugs que pertenecen a esos proyectos.
            // Nota: Firestore limita 'in' a 30 elementos. Si hay más, se necesita una estrategia diferente.
            const bugsQuery = query(collection(db, "bugs"), where("proyecto_id", "in", projectIds.slice(0, 30)));
            
            const unsubscribe = onSnapshot(bugsQuery, (snapshot) => {
                const bugsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setBugs(bugsData);
                setLoading(false);
            });

            return unsubscribe;
        } catch (error) {
            console.error("Error al cargar bugs (BugList): ", error.message);
            setLoading(false);
        }
    };

    let unsubscribe;
    fetchBugs().then(res => unsubscribe = res);

    // Limpiar el listener al desmontar el componente.
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
}, [user]);

  const BugRow = ({ bug }) => (
    <tr className="hover:bg-gray-50">
        <td className="p-4 text-sm font-bold text-gray-800">
            <Link to={`/proyectos/${bug.proyecto_id}/issues/${bug.id}`} className="hover:underline text-indigo-600">
                {bug.titulo}
            </Link>
        </td>
        <td className="p-4 text-sm text-gray-600">{bug.proyecto_nombre || 'N/A'}</td>
        <td className="p-4 text-sm">
            <span className={`px-2 py-1 text-xs font-bold rounded-full ${bug.estado === 'Abierto' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                {bug.estado}
            </span>
        </td>
        <td className="p-4 text-sm text-gray-600">{bug.prioridad}</td>
        <td className="p-4 text-sm text-gray-600">{bug.asignado_a_nombre || 'Sin asignar'}</td>
        <td className="p-4 text-sm text-gray-500">{bug.creado_en?.toDate().toLocaleDateString()}</td>
    </tr>
  );

  return (
    <div className="p-4 sm:p-6 space-y-6">
        <div className="flex justify-between items-center">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Lista de Bugs</h1>
             {/* El botón de crear ahora debería llevar a una página de selección de proyecto primero */}
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100">
            {loading ? (
                <div className="p-10 text-center">Cargando bugs...</div>
            ) : bugs.length > 0 ? (
                <table className="w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="p-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Título</th>
                            <th className="p-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Proyecto</th>
                            <th className="p-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Estado</th>
                            <th className="p-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Prioridad</th>
                            <th className="p-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Asignado a</th>
                            <th className="p-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Fecha</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {bugs.map(bug => <BugRow key={bug.id} bug={bug} />)}
                    </tbody>
                </table>
            ) : (
                <div className="p-10 text-center">
                    <FaBug className="mx-auto text-4xl text-gray-300"/>
                    <h3 className="mt-4 text-lg font-bold text-gray-800">¡Todo en orden!</h3>
                    <p className="mt-2 text-sm text-gray-500">No se encontraron bugs en tus proyectos.</p>
                </div>
            )}
        </div>
    </div>
  );
};

export default BugList;

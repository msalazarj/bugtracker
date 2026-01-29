// src/pages/Bugs/BugList.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { Link, useParams } from 'react-router-dom';
import { FaPlus, FaBug, FaEye, FaPencilAlt, FaUserCircle } from 'react-icons/fa';
import Tippy from '@tippyjs/react';

// --- REFACTOR UI: Insignias visuales --- 
const PriorityBadge = ({ priority }) => {
  const styles = {
    Crítica: 'bg-red-100 text-red-800 border-red-300',
    Alta: 'bg-orange-100 text-orange-800 border-orange-300',
    Media: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    Baja: 'bg-blue-100 text-blue-800 border-blue-300',
  };
  return <span className={`px-3 py-1 text-xs font-bold rounded-full border ${styles[priority] || 'bg-gray-100'}`}>{priority}</span>;
};

const StatusBadge = ({ status }) => {
  const styles = {
    Abierto: 'bg-red-100 text-red-800',
    'En Progreso': 'bg-blue-100 text-blue-800',
    Resuelto: 'bg-green-100 text-green-800',
    Cerrado: 'bg-gray-200 text-gray-800',
  };
  return <span className={`px-3 py-1 text-xs font-bold rounded-full ${styles[status] || 'bg-gray-100'}`}>{status}</span>;
};

// --- REFACTOR UX: Skeleton Loader para la tabla ---
const BugListSkeleton = () => (
  <div className="w-full animate-pulse">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="flex items-center p-4 border-b border-gray-200">
        <div className="flex-grow pr-4">
          <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="w-24 h-6 bg-gray-200 rounded-full mx-4"></div>
        <div className="w-24 h-6 bg-gray-200 rounded-full mx-4"></div>
        <div className="w-10 h-10 bg-gray-200 rounded-full mx-4"></div>
        <div className="w-24 h-8 bg-gray-200 rounded-lg ml-auto"></div>
      </div>
    ))}
  </div>
);

const BugList = () => {
  const { projectId } = useParams(); // Obtener projectId del contexto del enrutador
  const { user } = useAuth();
  const [bugs, setBugs] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [loading, setLoading] = useState(true);

  // --- REFACTOR UX: Estados para los filtros ---
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [priorityFilter, setPriorityFilter] = useState('Todas');

  useEffect(() => {
    if (!user) return;
    setLoading(true);

    const createQuery = () => {
      // Vista de "Mis Bugs" (sin projectId)
      if (!projectId) {
        // Esta consulta puede ser pesada. Idealmente, para "Mis Bugs" se usaría un campo `asignado_a_uid`.
        // Por ahora, consultaremos los bugs de los proyectos del usuario.
        return query(collection(db, "bugs"), where("member_ids", "array-contains", user.uid));
      } else {
        // Vista de Bugs de un Proyecto específico
        return query(collection(db, "bugs"), where("proyecto_id", "==", projectId));
      }
    };

    const q = createQuery();

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const bugsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBugs(bugsData);

      if (bugsData.length > 0) {
        const allUserIds = [...new Set(bugsData.map(b => b.asignado_a).filter(Boolean))];
        if (allUserIds.length > 0) {
          const profilesQuery = query(collection(db, "profiles"), where("__name__", "in", allUserIds));
          const profilesSnap = await getDocs(profilesQuery);
          const profilesMap = {};
          profilesSnap.forEach(doc => profilesMap[doc.id] = doc.data());
          setProfiles(profilesMap);
        }
      }
      setLoading(false);
    }, (error) => {
      console.error("Error al cargar bugs: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, projectId]);

  // --- REFACTOR UX: Lógica de filtrado y búsqueda ---
  const filteredBugs = useMemo(() => {
    return bugs.filter(bug => {
      const searchMatch = bug.titulo.toLowerCase().includes(searchTerm.toLowerCase());
      const statusMatch = statusFilter === 'Todos' || bug.estado === statusFilter;
      const priorityMatch = priorityFilter === 'Todas' || bug.prioridad === priorityFilter;
      return searchMatch && statusMatch && priorityMatch;
    });
  }, [bugs, searchTerm, statusFilter, priorityFilter]);

  return (
    <div className="space-y-6">
      {/* --- REFACTOR UI/UX: Barra de Herramientas --- */}
      <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
        <div className="relative w-full md:w-1/3">
          <input 
            type="text"
            placeholder="Buscar por título..."
            className="input-control pl-10 w-full"
            onChange={e => setSearchTerm(e.target.value)}
          />
          <FaBug className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
        <div className="flex items-center space-x-2">
          <select className="input-control" onChange={e => setStatusFilter(e.target.value)}>
            <option>Todos los Estados</option>
            <option>Abierto</option>
            <option>En Progreso</option>
            <option>Resuelto</option>
            <option>Cerrado</option>
          </select>
          <select className="input-control" onChange={e => setPriorityFilter(e.target.value)}>
            <option>Todas las Prioridades</option>
            <option>Crítica</option>
            <option>Alta</option>
            <option>Media</option>
            <option>Baja</option>
          </select>
          {projectId && (
            <Link to={`/proyectos/${projectId}/issues/crear`} className="btn-primary flex items-center whitespace-nowrap px-4 py-2">
              <FaPlus className="mr-2" /> Reportar Bug
            </Link>
          )}
        </div>
      </div>

      {/* --- REFACTOR UI: Tabla de Datos --- */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        {loading ? (
          <BugListSkeleton />
        ) : filteredBugs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3">Título del Issue</th>
                  <th scope="col" className="px-6 py-3">Prioridad</th>
                  <th scope="col" className="px-6 py-3">Estado</th>
                  <th scope="col" className="px-6 py-3">Asignado a</th>
                  <th scope="col" className="px-6 py-3">Fecha Reporte</th>
                  <th scope="col" className="px-6 py-3"><span className="sr-only">Acciones</span></th>
                </tr>
              </thead>
              <tbody>
                {filteredBugs.map(bug => {
                  const assignedUser = profiles[bug.asignado_a];
                  return (
                    <tr key={bug.id} className="bg-white border-b hover:bg-gray-50">
                      <th scope="row" className="px-6 py-4 font-bold text-gray-900 whitespace-nowrap">
                        <Link to={`/proyectos/${bug.proyecto_id}/issues/${bug.id}`} className="hover:underline">
                          {bug.titulo}
                        </Link>
                      </th>
                      <td className="px-6 py-4"><PriorityBadge priority={bug.prioridad} /></td>
                      <td className="px-6 py-4"><StatusBadge status={bug.estado} /></td>
                      <td className="px-6 py-4">
                        <Tippy content={assignedUser?.nombre_completo || 'Sin asignar'}>
                           {assignedUser ? (
                              <img src={assignedUser.avatar_url} alt={assignedUser.nombre_completo} className="h-8 w-8 rounded-full object-cover" />
                           ) : (
                              <FaUserCircle className="h-8 w-8 text-gray-300" />
                           )}
                        </Tippy>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">{bug.creado_en?.toDate().toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-right">
                        <Tippy content="Ver detalles">
                            <Link to={`/proyectos/${bug.proyecto_id}/issues/${bug.id}`} className="btn-icon text-gray-400 hover:text-indigo-600"><FaEye /></Link>
                        </Tippy>
                        <Tippy content="Editar bug">
                           <Link to={`/proyectos/${bug.proyecto_id}/issues/editar/${bug.id}`} className="btn-icon text-gray-400 hover:text-green-600 ml-2"><FaPencilAlt /></Link>
                        </Tippy>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          // --- REFACTOR UI: Estado Vacío Mejorado ---
          <div className="text-center p-12">
            <FaBug className="mx-auto text-5xl text-green-400" />
            <h3 className="mt-6 text-xl font-bold text-gray-800">¡Todo en orden!</h3>
            <p className="mt-2 text-md text-gray-500">No hay bugs que coincidan con tus filtros, o este proyecto aún no tiene ninguno.</p>
            {projectId && (
                <Link to={`/proyectos/${projectId}/issues/crear`} className="btn-primary inline-flex items-center px-5 py-2.5 mt-8">
                <FaPlus className="mr-2"/> Reportar el primer bug
                </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BugList;

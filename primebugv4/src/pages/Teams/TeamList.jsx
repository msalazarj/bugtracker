import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getTeams, updateTeam } from '../../services/teams'; 
import { collection, query, where, doc, getDoc, updateDoc, getCountFromServer } from 'firebase/firestore';
import { db } from '../../firebase';

// --- DESIGN SYSTEM ---
import { UI, formatDate } from '../../utils/design';
import { 
    FaPlus, FaUsers, FaFolderOpen, FaArrowRight, FaSpinner, 
    FaCrown, FaStar, FaRegStar, FaPen, FaSave, FaTimes 
} from 'react-icons/fa';

const TeamList = () => {
    const { user, switchTeam, updateTeamInState, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [projectCounts, setProjectCounts] = useState({});
    
    const [favoriteTeamId, setFavoriteTeamId] = useState(null);
    const [favLoading, setFavLoading] = useState(false);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editForm, setEditForm] = useState({ id: '', nombre: '', descripcion: '' });
    const [isSavingTeam, setIsSavingTeam] = useState(false);

    useEffect(() => {
        const fetchTeamsAndProfile = async () => {
            if (authLoading || !user) return;
            setLoading(true);
            
            try {
                const profileRef = doc(db, 'profiles', user.uid);
                
                const [teamsRes, profileSnap] = await Promise.all([
                    getTeams(),
                    getDoc(profileRef)
                ]);

                if (profileSnap.exists()) {
                    setFavoriteTeamId(profileSnap.data().favoriteTeamId || null);
                }

                if (teamsRes.success && teamsRes.data.length > 0) {
                    setTeams(teamsRes.data);
                    
                    const counts = {};
                    const countPromises = teamsRes.data.map(async (team) => {
                        const q = query(collection(db, 'projects'), where('teamId', '==', team.id));
                        const snapshot = await getCountFromServer(q);
                        counts[team.id] = snapshot.data().count;
                    });
                    
                    await Promise.all(countPromises);
                    setProjectCounts(counts);
                } else {
                    setTeams([]);
                }
            } catch (error) {
                console.error("Error al cargar equipos:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTeamsAndProfile();
    }, [user, authLoading]);

    const handleEnterTeam = (teamId) => {
        switchTeam(teamId);
        navigate('/proyectos');
    };

    const toggleFavorite = async (e, teamId) => {
        e.stopPropagation();
        if (favLoading) return;
        setFavLoading(true);

        try {
            const newFavId = favoriteTeamId === teamId ? null : teamId;
            const profileRef = doc(db, 'profiles', user.uid);
            
            await updateDoc(profileRef, {
                favoriteTeamId: newFavId,
                lastActiveTeamId: newFavId
            });

            setFavoriteTeamId(newFavId);
            
            if (newFavId) {
                switchTeam(newFavId);
            }

        } catch (error) {
            console.error("Error al actualizar favorito:", error);
        } finally {
            setFavLoading(false);
        }
    };

    const openEditModal = (e, team) => {
        e.stopPropagation();
        setEditForm({ id: team.id, nombre: team.nombre, descripcion: team.descripcion || '' });
        setIsEditModalOpen(true);
    };

    const handleSaveTeam = async (e) => {
        e.preventDefault();
        if (!editForm.nombre.trim()) return;
        setIsSavingTeam(true);

        const res = await updateTeam(editForm.id, {
            nombre: editForm.nombre,
            descripcion: editForm.descripcion
        });

        if (res.success) {
            setTeams(prev => prev.map(t => 
                t.id === editForm.id 
                ? { ...t, nombre: editForm.nombre, descripcion: editForm.descripcion } 
                : t
            ));
            
            updateTeamInState(editForm.id, editForm.nombre, editForm.descripcion);
            setIsEditModalOpen(false);
        } else {
            alert("Error al actualizar la información del equipo.");
        }
        setIsSavingTeam(false);
    };

    // =========================================================================
    // SKELETON LOADER
    // =========================================================================
    if (authLoading || loading) {
        return (
            <div className={UI.PAGE_CONTAINER}>
                {/* El Header se renderiza real e interactivo al instante */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className={UI.HEADER_TITLE}>Mis Equipos</h1>
                        <p className={UI.HEADER_SUBTITLE}>Gestiona tus espacios de colaboración.</p>
                    </div>
                    <Link to="/equipos/crear" className={UI.BTN_PRIMARY}>
                        <FaPlus /> Crear Nuevo Equipo
                    </Link>
                </div>

                {/* Grid de Esqueletos simulando las tarjetas de equipo */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className={`${UI.CARD_BASE} p-6 flex flex-col justify-between border-l-4 border-l-slate-200 animate-pulse bg-white`}>
                            {/* Header de la Tarjeta */}
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex-1 pr-4">
                                    <div className="h-8 w-2/3 bg-slate-200 rounded-lg mb-3"></div>
                                    <div className="h-4 w-1/3 bg-slate-100 rounded"></div>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-slate-100 flex-shrink-0"></div>
                            </div>

                            {/* Descripción */}
                            <div className="space-y-2 mb-8">
                                <div className="h-4 w-full bg-slate-100 rounded"></div>
                                <div className="h-4 w-4/5 bg-slate-100 rounded"></div>
                            </div>

                            {/* Cajas de Estadísticas */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-slate-50 rounded-2xl p-4 py-6 flex flex-col items-center">
                                    <div className="w-8 h-8 bg-slate-200 rounded-full mb-3"></div>
                                    <div className="h-8 w-12 bg-slate-200 rounded mb-2"></div>
                                    <div className="h-3 w-16 bg-slate-100 rounded"></div>
                                </div>
                                <div className="bg-slate-50 rounded-2xl p-4 py-6 flex flex-col items-center">
                                    <div className="w-8 h-8 bg-slate-200 rounded-full mb-3"></div>
                                    <div className="h-8 w-12 bg-slate-200 rounded mb-2"></div>
                                    <div className="h-3 w-16 bg-slate-100 rounded"></div>
                                </div>
                            </div>

                            {/* Footer de la Tarjeta */}
                            <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                                <div className="h-4 w-32 bg-slate-200 rounded"></div>
                                <div className="h-10 w-36 bg-slate-200 rounded-xl"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className={UI.PAGE_CONTAINER}>
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className={UI.HEADER_TITLE}>Mis Equipos</h1>
                    <p className={UI.HEADER_SUBTITLE}>Gestiona tus espacios de colaboración.</p>
                </div>
                <Link to="/equipos/crear" className={UI.BTN_PRIMARY}>
                    <FaPlus /> Crear Nuevo Equipo
                </Link>
            </div>

            {teams.length === 0 ? (
                <div className={`${UI.CARD_BASE} p-12 text-center`}>
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                        <FaUsers className="text-4xl text-slate-300" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-700 mb-2">Aún no perteneces a ningún equipo</h3>
                    <p className="text-slate-500 mb-6">Crea uno nuevo para comenzar.</p>
                    <Link to="/equipos/crear" className={UI.BTN_PRIMARY}>Crear Equipo</Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {teams.map((team) => {
                        const isFav = favoriteTeamId === team.id;
                        const isOwner = team.creador_id === user.uid;
                        
                        return (
                            <div key={team.id} className={`${UI.CARD_BASE} p-6 flex flex-col justify-between hover:shadow-lg transition-all group border-l-4 ${isFav ? 'border-l-amber-400' : 'border-l-transparent hover:border-l-indigo-500'}`}>
                                
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex-1 pr-4 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h2 className="text-2xl font-bold text-slate-800 group-hover:text-indigo-700 transition-colors truncate" title={team.nombre}>
                                                {team.nombre}
                                            </h2>
                                            
                                            <button 
                                                onClick={(e) => toggleFavorite(e, team.id)}
                                                className={`text-lg transition-transform active:scale-90 flex-shrink-0 ${isFav ? 'text-amber-400' : 'text-slate-200 hover:text-amber-300'}`}
                                                title={isFav ? "Quitar de favoritos" : "Marcar como favorito"}
                                            >
                                                {isFav ? <FaStar /> : <FaRegStar />}
                                            </button>

                                            {isOwner && (
                                                <button 
                                                    onClick={(e) => openEditModal(e, team)}
                                                    className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-200 text-slate-400 flex items-center justify-center hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 transition-all opacity-100 lg:opacity-0 lg:group-hover:opacity-100 flex-shrink-0"
                                                    title="Editar detalles del equipo"
                                                >
                                                    <FaPen size={10} />
                                                </button>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                                            {isOwner && (
                                                <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full flex items-center gap-1 font-bold border border-amber-200">
                                                    <FaCrown size={10} /> Propietario
                                                </span>
                                            )}
                                            <span>Creado: {formatDate(team.creado_en)}</span>
                                        </div>
                                    </div>
                                    <button onClick={() => handleEnterTeam(team.id)} className="w-10 h-10 rounded-full bg-slate-50 text-indigo-600 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all shadow-sm flex-shrink-0" title="Entrar al Equipo">
                                        <FaArrowRight />
                                    </button>
                                </div>

                                <p className="text-slate-500 text-sm mb-8 line-clamp-2 min-h-[40px]" title={team.descripcion}>
                                    {team.descripcion || 'Sin descripción disponible para este equipo.'}
                                </p>

                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="bg-slate-50/80 rounded-2xl p-4 flex flex-col items-center justify-center text-center border border-slate-100 group-hover:bg-indigo-50/30 transition-colors py-6">
                                        <FaUsers className="text-4xl text-indigo-400 mb-2" />
                                        <span className="text-3xl font-extrabold text-slate-800">{team.members?.length || 0}</span>
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Miembros</span>
                                    </div>

                                    <div className="bg-slate-50/80 rounded-2xl p-4 flex flex-col items-center justify-center text-center border border-slate-100 group-hover:bg-emerald-50/30 transition-colors py-6">
                                        <FaFolderOpen className="text-4xl text-emerald-400 mb-2" />
                                        <span className="text-3xl font-extrabold text-slate-800">{projectCounts[team.id] || 0}</span>
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Proyectos</span>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                                    <Link to={`/equipos/${team.id}/miembros`} className="text-xs font-bold text-slate-500 hover:text-indigo-600 hover:underline">
                                        Gestionar Miembros
                                    </Link>
                                    <button onClick={() => handleEnterTeam(team.id)} className="bg-indigo-600 text-white text-sm font-bold px-6 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
                                        Entrar al Equipo
                                    </button>
                                </div>

                            </div>
                        );
                    })}
                </div>
            )}

            {isEditModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                <FaPen className="text-indigo-600"/> Editar Equipo
                            </h3>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <FaTimes />
                            </button>
                        </div>
                        <form onSubmit={handleSaveTeam} className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Nombre del Equipo</label>
                                <input 
                                    type="text" 
                                    className={UI.INPUT_TEXT} 
                                    value={editForm.nombre} 
                                    onChange={e => setEditForm({...editForm, nombre: e.target.value})} 
                                    required 
                                    maxLength={50} 
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Descripción</label>
                                <textarea 
                                    className={`${UI.INPUT_TEXT} resize-none min-h-[100px]`} 
                                    value={editForm.descripcion} 
                                    onChange={e => setEditForm({...editForm, descripcion: e.target.value})} 
                                    maxLength={150}
                                    placeholder="Opcional: ¿Cuál es el propósito de este equipo?"
                                ></textarea>
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button 
                                    type="button" 
                                    onClick={() => setIsEditModalOpen(false)} 
                                    className="flex-1 py-2.5 text-slate-600 border border-slate-200 hover:bg-slate-50 rounded-xl font-bold transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={isSavingTeam || !editForm.nombre.trim()} 
                                    className="flex-1 bg-indigo-600 text-white rounded-xl font-bold shadow-md hover:bg-indigo-700 flex justify-center items-center gap-2 transition-colors disabled:opacity-50"
                                >
                                    {isSavingTeam ? <FaSpinner className="animate-spin"/> : <><FaSave/> Guardar</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeamList;
// src/pages/Teams/TeamMembers.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext.jsx';

const TeamMembers = () => {
    const { teamId } = useParams();
    const [team, setTeam] = useState(null);
    const [members, setMembers] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [userToAdd, setUserToAdd] = useState('');
    const [loading, setLoading] = useState(true);
    const [isOwner, setIsOwner] = useState(false);
    const { user } = useAuth();

    const fetchTeamAndMembers = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const teamRef = doc(db, "teams", teamId);
            const teamSnap = await getDoc(teamRef);

            if (teamSnap.exists() && teamSnap.data().members.includes(user.uid)) {
                const teamData = teamSnap.data();
                setTeam({ id: teamSnap.id, ...teamData });
                setIsOwner(teamData.ownerId === user.uid);

                if (teamData.members && teamData.members.length > 0) {
                    const membersQuery = query(collection(db, 'profiles'), where('__name__', 'in', teamData.members));
                    const membersSnap = await getDocs(membersQuery);
                    setMembers(membersSnap.docs.map(d => ({ id: d.id, ...d.data() })));
                }
            } else {
                setTeam(null);
            }
        } catch (error) {
            console.error("Error cargando miembros del equipo:", error.message);
        } finally {
            setLoading(false);
        }
    }, [teamId, user]);

    useEffect(() => {
        fetchTeamAndMembers();
    }, [fetchTeamAndMembers]);

    useEffect(() => {
        if (isOwner) {
            const fetchUsers = async () => {
                const usersSnap = await getDocs(collection(db, 'profiles'));
                setAllUsers(usersSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            };
            fetchUsers();
        }
    }, [isOwner]);

    const handleAddMember = async () => {
        if (!userToAdd || !isOwner) return;
        const teamRef = doc(db, "teams", teamId);
        await updateDoc(teamRef, { members: arrayUnion(userToAdd) });
        fetchTeamAndMembers();
        setUserToAdd('');
    };

    const handleRemoveMember = async (memberId) => {
        if (memberId === team.ownerId || !isOwner) return;
        const teamRef = doc(db, "teams", teamId);
        await updateDoc(teamRef, { members: arrayRemove(memberId) });
        fetchTeamAndMembers();
    };

    if (loading) return <p>Cargando miembros...</p>;
    if (!team) return <p>Acceso denegado.</p>;

    return (
        <div className="p-6">
            <h2 className="text-xl font-bold mb-4">Miembros del Equipo: {team.nombre}</h2>
            {isOwner && (
                <div className="flex gap-2 mb-4">
                    <select value={userToAdd} onChange={e => setUserToAdd(e.target.value)} className="border p-2 rounded-md">
                        <option value="">Seleccionar usuario</option>
                        {allUsers.filter(u => !members.some(m => m.id === u.id)).map(u => (
                            <option key={u.id} value={u.id}>{u.nombre_completo} ({u.email})</option>
                        ))}
                    </select>
                    <button onClick={handleAddMember} className="bg-indigo-500 text-white px-4 py-2 rounded-md">Añadir</button>
                </div>
            )}
            <ul className="space-y-2">
                {members.map(member => (
                    <li key={member.id} className="flex justify-between items-center p-3 bg-white rounded-md shadow-sm">
                        <span>{member.nombre_completo}</span>
                        {isOwner && member.id !== team.ownerId && (
                            <button onClick={() => handleRemoveMember(member.id)} className="text-red-500">Eliminar</button>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default TeamMembers;

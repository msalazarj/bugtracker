import React, { useState, useEffect, useRef } from 'react';
import { FaUser, FaChevronDown, FaCheck, FaBug } from 'react-icons/fa';
import { UI } from '../../utils/design';

// Función de comparación para React.memo
// Solo re-renderiza si cambia el valor seleccionado o la cantidad de miembros
const arePropsEqual = (prevProps, nextProps) => {
    return (
        prevProps.value === nextProps.value &&
        prevProps.members === nextProps.members // Si la referencia del array cambia, se actualiza
    );
};

const UserSelect = React.memo(({ members = [], value, onChange, label = "Asignar a" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Cerrar al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Encontrar usuario seleccionado de forma segura
    const selectedUser = members.find(m => m.id === value);

    const handleSelect = (id) => {
        onChange(id);
        setIsOpen(false);
    };

    return (
        <div className="space-y-2" ref={dropdownRef}>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <FaUser className="text-indigo-400"/> {label}
            </label>
            
            <div className="relative">
                {/* Botón Trigger */}
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className={`w-full text-left flex items-center justify-between ${UI.INPUT_TEXT} ${isOpen ? 'ring-4 ring-indigo-500/10 border-indigo-500' : ''} transition-all duration-200`}
                >
                    {value && selectedUser ? (
                        <div className="flex items-center gap-2 overflow-hidden">
                            <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold flex-shrink-0 border border-indigo-200">
                                {selectedUser.nombre_completo ? selectedUser.nombre_completo.charAt(0).toUpperCase() : <FaUser className="text-[10px]"/>}
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-slate-900 font-bold text-xs truncate leading-tight">{selectedUser.nombre_completo || 'Usuario'}</span>
                                <span className="text-[9px] text-slate-400 truncate leading-tight">{selectedUser.email}</span>
                            </div>
                        </div>
                    ) : (
                        <span className="text-slate-400 italic flex items-center gap-2 text-xs">
                            <div className="w-6 h-6 rounded-full border border-dashed border-slate-300 flex items-center justify-center text-[10px] flex-shrink-0 bg-slate-50">?</div>
                            Sin Asignar
                        </span>
                    )}
                    <FaChevronDown className={`text-xs text-slate-400 transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180 text-indigo-500' : ''}`}/>
                </button>

                {/* Lista Desplegable */}
                {isOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden animate-fade-in-down origin-top">
                        
                        {/* Opción: Sin Asignar */}
                        <button
                            type="button"
                            onClick={() => handleSelect('')}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50 group"
                        >
                            <div className="w-8 h-8 rounded-full border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center text-slate-400 flex-shrink-0 group-hover:border-indigo-300 group-hover:text-indigo-500 transition-colors">
                                <FaBug className="text-xs"/>
                            </div>
                            <div className="text-left overflow-hidden">
                                <p className="text-sm font-bold text-slate-700 group-hover:text-indigo-700 transition-colors">Sin Asignar</p>
                                <p className="text-[10px] text-slate-400 truncate">Dejar en el backlog</p>
                            </div>
                            {!value && <FaCheck className="ml-auto text-indigo-600 text-xs flex-shrink-0"/>}
                        </button>

                        {/* Lista de Miembros */}
                        <div className="max-h-60 overflow-y-auto custom-scrollbar">
                            {members.length > 0 ? (
                                members.map((m) => (
                                    <button
                                        key={m.id}
                                        type="button"
                                        onClick={() => handleSelect(m.id)}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-indigo-50/60 transition-colors border-b border-slate-50 last:border-0 group"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs border border-indigo-200 flex-shrink-0 group-hover:scale-105 transition-transform">
                                            {m.nombre_completo ? m.nombre_completo.charAt(0).toUpperCase() : <FaUser/>}
                                        </div>
                                        <div className="text-left overflow-hidden flex-1 min-w-0">
                                            <p className="text-sm font-bold text-slate-700 truncate group-hover:text-indigo-900 transition-colors">{m.nombre_completo || 'Usuario Sin Nombre'}</p>
                                            <p className="text-[10px] text-slate-400 truncate">{m.email}</p>
                                        </div>
                                        {value === m.id && <FaCheck className="ml-auto text-indigo-600 text-xs flex-shrink-0"/>}
                                    </button>
                                ))
                            ) : (
                                <div className="p-6 text-center text-slate-400 text-xs italic flex flex-col items-center gap-2">
                                    <FaUser className="text-xl opacity-20"/>
                                    No hay miembros en el equipo.
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}, arePropsEqual); // Aplicamos la comparación personalizada

export default UserSelect;
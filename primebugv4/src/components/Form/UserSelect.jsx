import React, { useState, useEffect, useRef } from 'react';
import { FaUser, FaChevronDown, FaCheck, FaBug } from 'react-icons/fa';
import { UI } from '../../utils/design'; // Consumimos la base de diseño

const UserSelect = ({ members = [], value, onChange, label = "Asignar a" }) => {
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

    const selectedUser = members.find(m => m.id === value);

    const handleSelect = (id) => {
        onChange(id);
        setIsOpen(false);
    };

    return (
        <div className="space-y-2" ref={dropdownRef}>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <FaUser/> {label}
            </label>
            
            <div className="relative">
                {/* Botón Trigger (Usa UI.INPUT_TEXT para consistencia visual) */}
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className={`w-full text-left flex items-center justify-between ${UI.INPUT_TEXT} ${isOpen ? 'ring-4 ring-indigo-500/10 border-indigo-500' : ''}`}
                >
                    {value && selectedUser ? (
                        <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold">
                                {selectedUser.nombre_completo.charAt(0)}
                            </div>
                            <span className="text-slate-900 font-medium">{selectedUser.nombre_completo}</span>
                        </div>
                    ) : (
                        <span className="text-slate-500 italic flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full border border-dashed border-slate-300 flex items-center justify-center text-[10px]">?</span>
                            Sin Asignar
                        </span>
                    )}
                    <FaChevronDown className={`text-xs text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}/>
                </button>

                {/* Lista Desplegable */}
                {isOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-fade-in origin-top">
                        
                        {/* Opción: Sin Asignar */}
                        <button
                            type="button"
                            onClick={() => handleSelect('')}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50"
                        >
                            <div className="w-8 h-8 rounded-full border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center text-slate-400">
                                <FaBug className="text-xs"/>
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-bold text-slate-700">Sin Asignar</p>
                                <p className="text-[10px] text-slate-400">Dejar en el backlog</p>
                            </div>
                            {!value && <FaCheck className="ml-auto text-indigo-600 text-xs"/>}
                        </button>

                        {/* Lista de Miembros */}
                        <div className="max-h-60 overflow-y-auto custom-scrollbar">
                            {members.map((m) => (
                                <button
                                    key={m.id}
                                    type="button"
                                    onClick={() => handleSelect(m.id)}
                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-indigo-50/50 transition-colors"
                                >
                                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs border border-indigo-200">
                                        {m.nombre_completo?.charAt(0) || <FaUser/>}
                                    </div>
                                    <div className="text-left overflow-hidden">
                                        <p className="text-sm font-bold text-slate-700 truncate">{m.nombre_completo}</p>
                                        <p className="text-[10px] text-slate-400 truncate">{m.email}</p>
                                    </div>
                                    {value === m.id && <FaCheck className="ml-auto text-indigo-600 text-xs"/>}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserSelect;
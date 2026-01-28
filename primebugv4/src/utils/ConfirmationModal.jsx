// src/utils/ConfirmationModal.jsx
import React, { useEffect } from 'react';

/**
 * @file Modal de confirmación genérico.
 * @description Proporciona una capa de seguridad para acciones destructivas o críticas.
 */

const ConfirmationModal = ({ 
    isOpen, 
    title, 
    message, 
    onConfirm, 
    onCancel, 
    confirmText = 'Confirmar', 
    cancelText = 'Cancelar' 
}) => {
    
    // Bloquear el scroll del body cuando el modal está abierto
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 z-[100] flex justify-center items-center p-4 animate-fade-in"
            role="dialog"
            aria-modal="true"
        >
            {/* Backdrop con desenfoque (Blur) */}
            <div 
                className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" 
                onClick={onCancel}
            />

            {/* Contenedor del Modal */}
            <div 
                className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md transform transition-all animate-scale-in border border-gray-100"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Título con jerarquía clara */}
                <h3 className="text-xl font-black text-gray-900 mb-3 tracking-tight">
                    {title}
                </h3>
                
                {/* Mensaje descriptivo */}
                <p className="text-gray-500 text-sm leading-relaxed mb-8">
                    {message}
                </p>

                {/* Acciones */}
                <div className="flex flex-col sm:flex-row justify-end gap-3">
                    <button 
                        onClick={onCancel}
                        className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-all order-2 sm:order-1"
                    >
                        {cancelText}
                    </button>
                    <button 
                        onClick={onConfirm}
                        className="px-6 py-2.5 text-sm font-black text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-lg shadow-red-200 transition-all order-1 sm:order-2"
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
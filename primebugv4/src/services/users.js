// src/services/users.js

// Propósito: Simular un servicio de datos para la entidad "Usuarios".

export const mockAllSystemUsers = [
  { id: 'user_001', nombre_completo: 'Ana Desarrolladora', email: 'ana.dev@example.com', fecha_union: '2024-01-15', rol: 'Administrador', avatar_url: 'https://i.pravatar.cc/150?u=user_001' },
  { id: 'user_002', nombre_completo: 'Pedro Backend Dev', email: 'pedro.backend@example.com', fecha_union: '2024-01-20', rol: 'Miembro', avatar_url: 'https://i.pravatar.cc/150?u=user_002' },
  { id: 'user_003', nombre_completo: 'Sofia Frontend Dev', email: 'sofia.frontend@example.com', fecha_union: '2024-02-01', rol: 'Miembro', avatar_url: 'https://i.pravatar.cc/150?u=user_003' },
  { id: 'user_004', nombre_completo: 'Juan Probador', email: 'juan.tester@example.com', fecha_union: '2024-02-05', rol: 'Miembro', avatar_url: 'https://i.pravatar.cc/150?u=user_004' },
  { id: 'user_005', nombre_completo: 'Laura Diseñadora UX', email: 'laura.ux@example.com', fecha_union: '2024-02-10', rol: 'Miembro', avatar_url: 'https://i.pravatar.cc/150?u=user_005' },
  { id: 'user_006', nombre_completo: 'Carlos Creador Ficticio', email: 'carlos.creador@example.com', fecha_union: '2024-03-01', rol: 'Administrador', avatar_url: null },
  { id: 'user_007', nombre_completo: 'Jorge Salazar', email: 'jorge.salazar@aguasnuevas.cl', fecha_union: '2023-12-01', rol: 'Administrador', avatar_url: null },
];

export const fetchAllUsers = async () => {
  console.log("MOCK: Obteniendo todos los usuarios del sistema.");
  await new Promise(resolve => setTimeout(resolve, 300));
  return { success: true, data: mockAllSystemUsers };
};

export const inviteUser = async (userId, role) => {
  const user = mockAllSystemUsers.find(u => u.id === userId);
  console.log(`MOCK: Invitando a ${user.nombre_completo} con el rol de ${role}.`);
  await new Promise(resolve => setTimeout(resolve, 500));
  console.log("MOCK: Invitación enviada exitosamente.");
  return { success: true };
};

// --- NUEVA FUNCIÓN PARA OBTENER EL PERFIL DEL USUARIO LOGUEADO ---
export const getCurrentUserProfile = async () => {
    console.log("MOCK: Obteniendo perfil del usuario actual.");
    await new Promise(resolve => setTimeout(resolve, 300));
    // Devolvemos el perfil de 'Jorge Salazar' como ejemplo del usuario logueado
    const userProfile = mockAllSystemUsers.find(u => u.id === 'user_007');
    return { success: true, data: userProfile };
};

// --- NUEVA FUNCIÓN PARA ACTUALIZAR EL PERFIL DEL USUARIO ---
export const updateUserProfile = async (profileData) => {
    console.log("MOCK: Actualizando perfil con los siguientes datos:", profileData);
    await new Promise(resolve => setTimeout(resolve, 600));
    // En una app real, aquí se haría la llamada a Supabase para actualizar
    // y subir la imagen si es necesario.
    console.log("MOCK: Perfil actualizado exitosamente.");
    return { success: true, data: profileData };
};
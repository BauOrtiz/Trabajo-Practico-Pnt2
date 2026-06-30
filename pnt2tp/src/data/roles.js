export const ROLES = {
  ADMIN: 'administrador',
  USUARIO: 'usuario'
}

export const NOMBRES_ROLES = {
  [ROLES.ADMIN]: 'Administrador',
  [ROLES.USUARIO]: 'Usuario'
}

// Cuentas administradoras hardcodeadas.
export const ADMINISTRADORES_HARDCODEADOS = [
  {
    id: 'admin-1',
    nombre: 'Administrador',
    email: 'admin@prode.com',
    password: 'admin123',
    rol: ROLES.ADMIN
  }
]

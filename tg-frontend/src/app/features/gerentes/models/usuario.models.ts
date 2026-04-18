export interface RolResponse {
  idRol: number;
  nombre: string;
  descripcion: string | null;
  estado: boolean;
}

export interface UsuarioResponse {
  idUsuario: number;
  nombreCompleto: string;
  email: string;
  rol: string;
  idSede: number | null;
  estado: boolean;
  fechaCreacion: string;
}
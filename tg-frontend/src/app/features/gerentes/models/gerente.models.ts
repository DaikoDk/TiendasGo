export interface CreateGerenteRequest {
  nombres: string;
  apellidos: string;
  password: string;
  idSede?: number | null;
  adminEmail: string;
  adminPassword: string;
  estado?: boolean;
}

export interface UpdateGerenteRequest {
  nombreCompleto: string;
  email: string;
  password?: string;
  idSede: number;
  estado?: boolean;
}

export interface GerenteResponse {
  idUsuario: number;
  nombreCompleto: string;
  email: string;
  rol?: string;
  idSede: number | null;
  estado: boolean;
  fechaCreacion: string;
}

export interface GerenteDropdownItem {
  idUsuario: number;
  nombreCompleto: string;
  email?: string;
  estado?: boolean;
}

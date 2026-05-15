export interface SedeGerenteInfo {
  idUsuario: number;
  nombreCompleto: string;
  email: string | null;
  estado: boolean;
}

export interface SedeRequest {
  nombre: string;
  email?: string;
  direccion: string;
  ubigeo: string;
  telefono: string;
  esAlmacenCentral: boolean;
  estado: boolean;
  horarioConfig: Record<string, unknown>;
  idGerente: number | null;
}

export interface SedeResponse {
  idSede: number;
  nombre: string;
  email: string | null;
  gerenteNombre: string | null;
  gerenteEmail: string | null;
  direccion: string | null;
  ubigeo: string | null;
  telefono: string | null;
  esAlmacenCentral: boolean;
  estado: boolean;
  horarioConfig: Record<string, unknown> | string | null;
  idGerente: number | null;
  gerente: SedeGerenteInfo | null;
}

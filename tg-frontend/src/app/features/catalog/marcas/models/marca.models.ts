export interface MarcaRequest {
  nombre: string;
  codigoMarca?: string | null;
  activo: boolean;
}

export interface MarcaResponse {
  id: number;
  nombre: string;
  codigoMarca?: string | null;
  activo: boolean;
}

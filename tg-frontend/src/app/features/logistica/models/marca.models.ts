export interface MarcaRequest {
  nombre: string;
}

export interface MarcaResponse {
  id: number;
  nombre: string;
  codigoMarca?: string | null;
  activo?: boolean;
}

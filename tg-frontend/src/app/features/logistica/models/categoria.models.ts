export interface CategoriaRequest {
  nombre: string;
  prefijo?: string | null;
}

export interface CategoriaResponse {
  id: number;
  nombre: string;
  prefijo: string | null;
  estado: boolean;
}

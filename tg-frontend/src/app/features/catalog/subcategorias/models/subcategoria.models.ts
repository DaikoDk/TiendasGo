export interface SubCategoriaRequest {
  nombre: string;
  idCategoria: number;
  prefijo?: string | null;
}

export interface SubCategoriaResponse {
  id: number;
  nombre: string;
  idCategoria: number;
  nombreCategoriaPadre?: string;
  prefijo?: string | null;
  estado: boolean;
}

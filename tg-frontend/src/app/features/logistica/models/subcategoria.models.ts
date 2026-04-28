export interface SubCategoriaRequest {
  nombre: string;
  idCategoria: number;
}

export interface SubCategoriaResponse {
  id: number;
  nombre: string;
  idCategoria: number;
  nombreCategoriaPadre?: string;
  prefijo?: string | null;
  estado: boolean;
}

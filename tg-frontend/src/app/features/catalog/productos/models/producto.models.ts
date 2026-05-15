export interface Producto {
  id: number | null;
  nombreBase: string;
  variante: string | null;
  medidaValor: string | null;
  medidaUnidad: string | null;
  sku: string | null;
  precioCosto: number | null;
  precioVenta: number | null;
  imagenUrl: string | null;
  estado: boolean;
  nombreMarca: string | null;
  nombreSubCategoria: string | null;
  idMarca?: number | null;
  idSubCategoria?: number | null;
}

export interface ProductoRequest {
  idSubCategoria: number;
  idMarca: number;
  nombreBase: string;
  variante?: string | null;
  medidaValor?: string | null;
  sku?: string | null;
  medidaUnidad?: string | null;
  precioCosto: number;
  precioVenta: number;
  imagenUrl?: string | null;
  estado: boolean;
}

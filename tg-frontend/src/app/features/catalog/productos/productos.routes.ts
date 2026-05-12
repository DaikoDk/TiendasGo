import { Routes } from '@angular/router';

export const PRODUCTOS_ROUTES: Routes = [
  {
    path: 'nuevo',
    loadComponent: () => import('./pages/producto-form-page.component').then((m) => m.ProductoFormPageComponent)
  },

  {
    path: 'editar/:id',
    loadComponent: () => import('./pages/producto-form-page.component').then((m) => m.ProductoFormPageComponent)
  },
  {
    path: '',
    loadComponent: () => import('./pages/productos-page.component').then((m) => m.ProductosPageComponent),
    pathMatch: 'full'
  }
];

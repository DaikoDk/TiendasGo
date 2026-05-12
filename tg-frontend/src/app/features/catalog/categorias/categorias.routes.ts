import { Routes } from '@angular/router';

export const CATEGORIAS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/categorias-page.component').then((m) => m.CategoriasPageComponent)
  },
  {
    path: 'nueva',
    loadComponent: () => import('./pages/categorias-form-page.component').then((m) => m.CategoriasFormPageComponent)
  },
  {
    path: 'editar/:id',
    loadComponent: () => import('./pages/categorias-form-page.component').then((m) => m.CategoriasFormPageComponent)
  }
];

import { Routes } from '@angular/router';

export const SUBCATEGORIAS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/sub-categorias-page.component').then(m => m.SubCategoriasPageComponent)
  }
  ,
  {
    path: 'nueva',
    loadComponent: () => import('./pages/sub-categorias-form-page.component').then(m => m.SubCategoriasFormPageComponent)
  },
  {
    path: 'editar/:id',
    loadComponent: () => import('./pages/sub-categorias-form-page.component').then(m => m.SubCategoriasFormPageComponent)
  }
];

import { Routes } from '@angular/router';

export const MARCAS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/marcas-page.component').then((m) => m.MarcasPageComponent)
  },
  {
    path: 'nueva',
    loadComponent: () => import('./pages/marcas-form-page.component').then((m) => m.MarcasFormPageComponent)
  },
  {
    path: 'editar/:id',
    loadComponent: () => import('./pages/marcas-form-page.component').then((m) => m.MarcasFormPageComponent)
  }
];

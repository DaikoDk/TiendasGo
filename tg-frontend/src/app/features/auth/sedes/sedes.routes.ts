import { Routes } from '@angular/router';

export const SEDES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/sedes-page.component').then((m) => m.SedesPageComponent)
  },
  {
    path: 'nueva',
    loadComponent: () =>
      import('./pages/sede-form-page.component').then((m) => m.SedeFormPageComponent)
  },
  {
    path: 'editar/:id',
    loadComponent: () =>
      import('./pages/sede-form-page.component').then((m) => m.SedeFormPageComponent)
  },
  {
    path: 'detalle/:id',
    loadComponent: () =>
      import('./pages/sede-detail-page.component').then(
        (m) => m.SedeDetailPageComponent
      )
  }
];

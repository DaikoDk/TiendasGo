import { Routes } from '@angular/router';

export const GERENTES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/gerentes-page.component').then((m) => m.GerentesPageComponent)
  },
  {
    path: 'nuevo',
    loadComponent: () =>
      import('./pages/gerente-form-page.component').then((m) => m.GerenteFormPageComponent)
  },
  {
    path: 'editar/:id',
    loadComponent: () =>
      import('./pages/gerente-form-page.component').then((m) => m.GerenteFormPageComponent)
  },
  {
    path: 'detalle/:id',
    loadComponent: () =>
      import('./pages/gerente-detail-page.component').then((m) => m.GerenteDetailPageComponent)
  },
  {
    path: ':rol',
    loadComponent: () =>
      import('./pages/usuarios-rol-page.component').then((m) => m.UsuariosRolPageComponent)
  }
];

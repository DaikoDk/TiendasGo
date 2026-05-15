import { Routes } from '@angular/router';

export const USUARIOS_ROUTES: Routes = [
  {
    path: ':rol',
    loadComponent: () =>
      import('./pages/usuarios-rol-page.component').then((m) => m.UsuariosRolPageComponent)
  }
];

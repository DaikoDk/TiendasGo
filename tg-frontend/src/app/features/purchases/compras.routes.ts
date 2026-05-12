import { Routes } from '@angular/router';

export const COMPRAS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/compras-page.component').then((m) => m.ComprasPageComponent)
  }
];

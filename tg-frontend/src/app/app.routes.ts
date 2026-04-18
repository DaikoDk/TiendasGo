import { Routes } from '@angular/router';

import { authChildGuard, authGuard } from './core/auth/guards/auth.guard';

export const routes: Routes = [
	{
		path: '',
		pathMatch: 'full',
		redirectTo: 'dashboard'
	},
	{
		path: 'login',
		loadComponent: () =>
			import('./features/auth/pages/login-page.component').then(
				(m) => m.LoginPageComponent
			)
	},
	{
		path: 'dashboard',
		canActivate: [authGuard],
		canActivateChild: [authChildGuard],
		loadComponent: () =>
			import('./shared/components/layout/main-layout.component').then(
				(m) => m.MainLayoutComponent
			),
		children: [
			{
				path: 'sedes',
				loadChildren: () =>
					import('./features/sedes/sedes.routes').then((m) => m.SEDES_ROUTES)
			},
			{
				path: 'usuarios',
				loadChildren: () =>
					import('./features/gerentes/gerentes.routes').then((m) => m.GERENTES_ROUTES)
			},
			{
				path: 'gerentes',
				pathMatch: 'full',
				redirectTo: 'usuarios'
			},
			{
				path: 'inventario',
				loadChildren: () =>
					import('./features/inventario/inventario.routes').then(
						(m) => m.INVENTARIO_ROUTES
					)
			},
			{
				path: 'compras',
				loadChildren: () =>
					import('./features/compras/compras.routes').then((m) => m.COMPRAS_ROUTES)
			}
		]
	},
	{
		path: '**',
		redirectTo: 'login'
	}
];

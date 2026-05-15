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
			import('./features/auth/login/pages/login-page.component').then(
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
				path: 'administracion/sedes',
				loadChildren: () =>
					import('./features/auth/sedes/sedes.routes').then((m) => m.SEDES_ROUTES)
			},
			{
				path: 'administracion/usuarios',
				loadChildren: () =>
					import('./features/auth/usuarios/gerentes/gerentes.routes').then((m) => m.GERENTES_ROUTES)
			},
			{
				path: 'administracion/gerentes',
				pathMatch: 'full',
				redirectTo: 'administracion/usuarios'
			},
			{
				path: 'logistica',
				canActivate: [authGuard],
				canActivateChild: [authChildGuard],
				children: [
					{
						path: 'marcas',
						loadChildren: () =>
							import('./features/catalog/marcas/marcas.routes').then((m) => m.MARCAS_ROUTES)
					},
					{
						path: 'productos',
						loadChildren: () =>
							import('./features/catalog/productos/productos.routes').then((m) => m.PRODUCTOS_ROUTES)
					},
					{
						path: 'categorias',
						loadChildren: () =>
							import('./features/catalog/categorias/categorias.routes').then((m) => m.CATEGORIAS_ROUTES)
					},
					{
						path: 'sub-categorias',
						loadChildren: () =>
							import('./features/catalog/subcategorias/sub-categorias.routes').then((m) => m.SUBCATEGORIAS_ROUTES)
					}
				]
			},
			{
				path: 'compras/compras',
				loadChildren: () =>
					import('./features/purchases/compras.routes').then((m) => m.COMPRAS_ROUTES)
			},
			{
				path: 'sedes',
				pathMatch: 'full',
				redirectTo: 'administracion/sedes'
			},
			{
				path: 'usuarios',
				pathMatch: 'full',
				redirectTo: 'administracion/usuarios'
			},
			{
				path: 'gerentes',
				pathMatch: 'full',
				redirectTo: 'administracion/usuarios'
			},
			{
				path: 'compras',
				pathMatch: 'full',
				redirectTo: 'compras/compras'
			}
		]
	},
	{
		path: '**',
		redirectTo: 'login'
	}
];

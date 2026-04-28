import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-marcas-create',
  standalone: true,
  template: `
    <div class="p-4">
      <h2 class="font-headline text-xl font-bold">Crear Marca</h2>
      <p class="text-sm text-on-surface-variant">Usa el formulario para crear una nueva marca.</p>
      <div class="mt-4">
        <button (click)="goToForm()" class="h-10 rounded-full border border-on-surface/10 bg-primary px-4 text-sm font-semibold text-on-primary-fixed">Abrir formulario</button>
      </div>
    </div>
  `
})
export class MarcasCreateComponent {
  constructor(private router: Router) {}
  goToForm() {
    void this.router.navigate(['/dashboard/logistica/marcas/nueva']);
  }
}

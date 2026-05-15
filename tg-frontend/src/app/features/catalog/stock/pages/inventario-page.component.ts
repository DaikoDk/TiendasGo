import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AppCardComponent } from '../../../../shared/ui/app-card/app-card.component';

@Component({
  selector: 'app-inventario-page',
  imports: [AppCardComponent],
  templateUrl: './inventario-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InventarioPageComponent {}

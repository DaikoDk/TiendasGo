import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AppCardComponent } from '../../../shared/ui/app-card/app-card.component';

@Component({
  selector: 'app-compras-page',
  imports: [AppCardComponent],
  templateUrl: './compras-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ComprasPageComponent {}

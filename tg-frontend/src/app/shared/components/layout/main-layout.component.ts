import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { map } from 'rxjs';
import { LogOut, LucideAngularModule, UserRound } from 'lucide-angular';

import { AuthService } from '../../../core/auth/services/auth.service';
import { TokenStorageService } from '../../../core/auth/services/token-storage.service';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, SidebarComponent, LucideAngularModule],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MainLayoutComponent {
  private readonly authService = inject(AuthService);
  private readonly tokenStorage = inject(TokenStorageService);
  private readonly route = inject(ActivatedRoute);

  protected readonly loggingOut = signal(false);
  protected readonly userDisplayName = signal(this.resolveUserName());
  protected readonly accessDeniedMessage = toSignal(
    this.route.queryParamMap.pipe(
      map((params) => (params.get('accessDenied') === '1' ? 'No autorizado' : ''))
    ),
    { initialValue: '' }
  );
  protected readonly icons = {
    LogOut,
    UserRound
  };

  protected logout(): void {
    if (this.loggingOut()) {
      return;
    }

    this.loggingOut.set(true);

    this.authService
      .logout()
      .pipe(
        finalize(() => {
          this.loggingOut.set(false);
        })
      )
      .subscribe();
  }

  private resolveUserName(): string {
    const user = this.tokenStorage.getSessionUser();
    if (!user) {
      return 'Usuario';
    }

    const candidates = [user.nombreCompleto, user.email];

    for (const value of candidates) {
      if (typeof value === 'string' && value.trim().length > 0) {
        return value;
      }
    }

    return 'Usuario';
  }
}

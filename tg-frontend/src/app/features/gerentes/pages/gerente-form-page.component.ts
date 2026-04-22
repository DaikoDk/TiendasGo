import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../../../core/auth/services/auth.service';
import { TokenStorageService } from '../../../core/auth/services/token-storage.service';
import { readApiErrorMessage } from '../../../core/http/api-error.util';
import { AdminApprovalModalComponent } from '../../../shared/components/admin-approval-modal/admin-approval-modal.component';
import { SedeResponse } from '../../sedes/models/sede.models';
import { SedesService } from '../../sedes/services/sedes.service';
import { AppCardComponent } from '../../../shared/ui/app-card/app-card.component';
import { AppInputComponent } from '../../../shared/ui/app-input/app-input.component';
import { CreateGerenteRequest, UpdateGerenteRequest } from '../models/gerente.models';
import { GerentesService } from '../services/gerentes.service';

type PendingGerenteAction =
  | { mode: 'create'; payload: Omit<CreateGerenteRequest, 'adminEmail' | 'adminPassword'> }
  | { mode: 'update'; payload: UpdateGerenteRequest };

@Component({
  selector: 'app-gerente-form-page',
  imports: [
    RouterLink,
    ReactiveFormsModule,
    AdminApprovalModalComponent,
    AppCardComponent,
    AppInputComponent
  ],
  templateUrl: './gerente-form-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GerenteFormPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly gerentesService = inject(GerentesService);
  private readonly sedesService = inject(SedesService);
  private readonly authService = inject(AuthService);
  private readonly tokenStorage = inject(TokenStorageService);

  private readonly routeId = this.parseRouteId(this.route.snapshot.paramMap.get('id'));

  protected readonly isEditMode = signal(this.routeId !== null);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly approvalOpen = signal(false);
  protected readonly approvalLoading = signal(false);
  protected readonly approvalError = signal('');
  protected readonly approvalPrefilledEmail = signal('');
  protected readonly errorMessage = signal('');
  protected readonly statusMessage = signal('');
  protected readonly sedes = signal<SedeResponse[]>([]);
  protected readonly pendingPayload = signal<PendingGerenteAction | null>(null);

  protected readonly form = this.formBuilder.group({
    nombres: [''],
    apellidos: [''],
    nombreCompleto: [''],
    email: [''],
    password: [''],
    idSede: [''],
    estado: [true]
  });

  constructor() {
    this.configureFormByMode();

    const sessionUser = this.tokenStorage.getSessionUser();
    this.approvalPrefilledEmail.set(sessionUser?.email?.trim() ?? '');

    if (this.isEditMode()) {
      this.loadSedes();
      this.loadGerente();
    }
  }

  private configureFormByMode(): void {
    if (this.isEditMode()) {
      this.form.controls.nombreCompleto.setValidators([Validators.required, Validators.maxLength(150)]);
      this.form.controls.email.setValidators([
        Validators.required,
        Validators.email,
        Validators.maxLength(120)
      ]);
      this.form.controls.idSede.setValidators([Validators.required, this.positiveIntegerValidator()]);
      this.form.controls.password.setValidators([Validators.minLength(8)]);
    } else {
      this.form.controls.nombres.setValidators([Validators.required, Validators.maxLength(80)]);
      this.form.controls.apellidos.setValidators([Validators.required, Validators.maxLength(120)]);
      this.form.controls.password.setValidators([Validators.required, Validators.minLength(8)]);

      this.form.controls.nombreCompleto.clearValidators();
      this.form.controls.email.clearValidators();
      this.form.controls.idSede.clearValidators();
      this.form.controls.idSede.setValue('', { emitEvent: false });
    }

    this.form.controls.nombres.updateValueAndValidity({ emitEvent: false });
    this.form.controls.apellidos.updateValueAndValidity({ emitEvent: false });
    this.form.controls.nombreCompleto.updateValueAndValidity({ emitEvent: false });
    this.form.controls.email.updateValueAndValidity({ emitEvent: false });
    this.form.controls.password.updateValueAndValidity({ emitEvent: false });
    this.form.controls.idSede.updateValueAndValidity({ emitEvent: false });
  }

  protected submit(): void {
    this.errorMessage.set('');
    this.statusMessage.set('');

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage.set('Completa los campos requeridos antes de guardar el gerente.');
      return;
    }

    const raw = this.form.getRawValue();
    const estado = Boolean(raw.estado);

    if (this.isEditMode()) {
      const payload: UpdateGerenteRequest = {
        nombreCompleto: raw.nombreCompleto?.trim() ?? '',
        email: raw.email?.trim() ?? '',
        idSede: this.parseIdSede(raw.idSede),
        estado
      };

      const password = raw.password?.trim() ?? '';
      if (password.length > 0) {
        payload.password = password;
      }

      this.pendingPayload.set({ mode: 'update', payload });
    } else {
      this.pendingPayload.set({
        mode: 'create',
        payload: {
          nombres: raw.nombres?.trim() ?? '',
          apellidos: raw.apellidos?.trim() ?? '',
          password: raw.password?.trim() ?? '',
          idSede: null,
          estado
        }
      });
    }

    this.approvalError.set('');
    this.approvalOpen.set(true);
  }

  protected closeApprovalModal(): void {
    this.approvalOpen.set(false);
    this.approvalLoading.set(false);
    this.approvalError.set('');
    this.pendingPayload.set(null);
  }

  protected approveAndSave(credentials: { email: string; password: string }): void {
    const pending = this.pendingPayload();
    if (!pending) {
      this.closeApprovalModal();
      return;
    }

    this.approvalLoading.set(true);
    this.approvalError.set('');

    if (pending.mode === 'create') {
      const payload: CreateGerenteRequest = {
        ...pending.payload,
        adminEmail: credentials.email.trim(),
        adminPassword: credentials.password
      };

      this.persistGerenteCreate(payload);
      return;
    }

    this.authService.validateAdminCredentials(credentials).subscribe({
      next: (session) => this.persistGerenteUpdate(pending.payload, session.token),
      error: (error: unknown) => {
        this.approvalLoading.set(false);
        this.approvalError.set(readApiErrorMessage(error, 'No se pudo validar al administrador.'));
      }
    });
  }

  private persistGerenteCreate(payload: CreateGerenteRequest): void {
    this.saving.set(true);

    this.gerentesService
      .create(payload)
      .pipe(
        finalize(() => {
          this.saving.set(false);
          this.approvalLoading.set(false);
        })
      )
      .subscribe({
        next: (response) => {
          this.closeApprovalModal();
          this.statusMessage.set(response.message || 'Gerente guardado.');
          const id = response.data?.idUsuario ?? 0;
          if (id > 0) {
            void this.router.navigate(['/dashboard/administracion/usuarios/detalle', id]);
            return;
          }

          void this.router.navigate(['/dashboard/administracion/usuarios']);
        },
        error: (error: unknown) => {
          const message = this.resolveCreateError(error);
          this.errorMessage.set(message);
          this.approvalError.set(message);
        }
      });
  }

  private persistGerenteUpdate(payload: UpdateGerenteRequest, adminToken: string): void {
    if (this.routeId === null) {
      this.closeApprovalModal();
      return;
    }

    this.saving.set(true);

    this.gerentesService
      .update(this.routeId, payload, adminToken)
      .pipe(
        finalize(() => {
          this.saving.set(false);
          this.approvalLoading.set(false);
        })
      )
      .subscribe({
        next: (response) => {
          this.closeApprovalModal();
          this.statusMessage.set(response.message || 'Gerente guardado.');
          const id = response.data?.idUsuario ?? this.routeId ?? 0;
          if (id > 0) {
            void this.router.navigate(['/dashboard/administracion/usuarios/detalle', id]);
            return;
          }

          void this.router.navigate(['/dashboard/administracion/usuarios']);
        },
        error: (error: unknown) => {
          this.errorMessage.set(readApiErrorMessage(error, 'No se pudo guardar el gerente.'));
        }
      });
  }

  private loadGerente(): void {
    if (this.routeId === null) {
      return;
    }

    this.loading.set(true);

    this.gerentesService
      .getById(this.routeId)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (gerente) => {
          this.form.patchValue({
            nombreCompleto: gerente.nombreCompleto,
            email: gerente.email,
            idSede: gerente.idSede ? String(gerente.idSede) : '',
            estado: gerente.estado
          });
        },
        error: (error: unknown) => {
          this.errorMessage.set(readApiErrorMessage(error, 'No se pudo cargar el gerente.'));
        }
      });
  }

  private loadSedes(): void {
    this.sedesService.getAll().subscribe({
      next: (data) => {
        this.sedes.set(data);
      },
      error: (error: unknown) => {
        this.errorMessage.set(readApiErrorMessage(error, 'No se pudo cargar el listado de sedes.'));
      }
    });
  }

  private resolveCreateError(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return readApiErrorMessage(error, 'No se pudo crear el gerente.');
    }

    if (error.status === 400) {
      const backendMsg = this.readBackendMessage(error, '');
      if (backendMsg.length > 0) {
        return backendMsg;
      }
      return 'Verifica que los datos enviados sean válidos. Posibles causas: gerente ya existe, datos inválidos.';
    }

    if (error.status === 401) {
      if (this.isSessionExpiredError(error)) {
        this.authService.clearSession();
        void this.router.navigateByUrl('/login');
        return 'Tu sesion expiro. Inicia sesion nuevamente.';
      }
      return 'Las credenciales ADMIN no son válidas. Verifica el email y contraseña del administrador.';
    }

    if (error.status === 403) {
      return 'El email ADMIN no coincide con el del administrador que inició sesión.';
    }

    return readApiErrorMessage(error, 'No se pudo crear el gerente.');
  }

  private readBackendMessage(error: HttpErrorResponse, fallback: string): string {
    const source = error.error;

    if (typeof source === 'string' && source.trim().length > 0) {
      return source;
    }

    if (source && typeof source === 'object') {
      const record = source as Record<string, unknown>;
      const message = record['message'] ?? record['error'];
      if (typeof message === 'string' && message.trim().length > 0) {
        return message;
      }
    }

    return fallback;
  }

  private isSessionExpiredError(error: HttpErrorResponse): boolean {
    const message = this.readBackendMessage(error, '').toLowerCase();
    if (!message) {
      return true;
    }

    if (message.includes('admin') || message.includes('credencial')) {
      return false;
    }

    return (
      message.includes('token') ||
      message.includes('jwt') ||
      message.includes('expir') ||
      message.includes('sesion') ||
      message.includes('session') ||
      message.includes('unauthorized')
    );
  }

  private parseRouteId(value: string | null): number | null {
    if (!value) {
      return null;
    }

    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  }

  private parseIdSede(value: unknown): number {
    if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
      return value;
    }

    if (typeof value === 'string') {
      const parsed = Number(value.trim());
      return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
    }

    return 0;
  }

  private positiveIntegerValidator() {
    return (control: import('@angular/forms').AbstractControl) => {
      const value = control.value;
      if (value === null || value === undefined || value === '') {
        return { positiveInteger: true };
      }

      const parsed = typeof value === 'number' ? value : Number(value);
      return Number.isInteger(parsed) && parsed > 0 ? null : { positiveInteger: true };
    };
  }

  protected readonly approvalTitle = this.isEditMode()
    ? 'Aprobacion para editar gerente'
    : 'Aprobacion para crear gerente';
}

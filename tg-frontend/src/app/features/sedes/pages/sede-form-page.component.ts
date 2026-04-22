import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../../../core/auth/services/auth.service';
import { AdminApprovalModalComponent } from '../../../shared/components/admin-approval-modal/admin-approval-modal.component';
import { AppButtonComponent } from '../../../shared/ui/app-button/app-button.component';
import { AppCardComponent } from '../../../shared/ui/app-card/app-card.component';
import { AppInputComponent } from '../../../shared/ui/app-input/app-input.component';
import { GerenteDropdownItem } from '../../gerentes/models/gerente.models';
import { GerentesService } from '../../gerentes/services/gerentes.service';
import { SedeRequest, SedeResponse } from '../models/sede.models';
import { SedesService } from '../services/sedes.service';

interface DistrictOption {
  ubigeo: string;
  nombre: string;
}

interface WeekDay {
  key: string;
  label: string;
  shortLabel: string;
}

interface DaySchedule {
  cerrado: boolean;
  apertura: string;
  cierre: string;
}

const DISTRICT_OPTIONS: DistrictOption[] = [
  { ubigeo: '150101', nombre: 'Lima' },
  { ubigeo: '150102', nombre: 'Ancon' },
  { ubigeo: '150103', nombre: 'Ate' },
  { ubigeo: '150104', nombre: 'Barranco' },
  { ubigeo: '150105', nombre: 'Brena' },
  { ubigeo: '150106', nombre: 'Carabayllo' },
  { ubigeo: '150107', nombre: 'Chaclacayo' },
  { ubigeo: '150108', nombre: 'Chorrillos' },
  { ubigeo: '150109', nombre: 'Cieneguilla' },
  { ubigeo: '150110', nombre: 'Comas' },
  { ubigeo: '150111', nombre: 'El Agustino' },
  { ubigeo: '150112', nombre: 'Independencia' },
  { ubigeo: '150113', nombre: 'Jesus Maria' },
  { ubigeo: '150114', nombre: 'La Molina' },
  { ubigeo: '150115', nombre: 'La Victoria' },
  { ubigeo: '150116', nombre: 'Lince' },
  { ubigeo: '150117', nombre: 'Los Olivos' },
  { ubigeo: '150118', nombre: 'Lurigancho' },
  { ubigeo: '150119', nombre: 'Lurin' },
  { ubigeo: '150120', nombre: 'Magdalena del Mar' },
  { ubigeo: '150121', nombre: 'Pueblo Libre' },
  { ubigeo: '150122', nombre: 'Miraflores' },
  { ubigeo: '150123', nombre: 'Pachacamac' },
  { ubigeo: '150124', nombre: 'Pucusana' },
  { ubigeo: '150125', nombre: 'Puente Piedra' },
  { ubigeo: '150126', nombre: 'Punta Hermosa' },
  { ubigeo: '150127', nombre: 'Punta Negra' },
  { ubigeo: '150128', nombre: 'Rimac' },
  { ubigeo: '150129', nombre: 'San Bartolo' },
  { ubigeo: '150130', nombre: 'San Borja' },
  { ubigeo: '150131', nombre: 'San Isidro' },
  { ubigeo: '150132', nombre: 'San Juan de Lurigancho' },
  { ubigeo: '150133', nombre: 'San Juan de Miraflores' },
  { ubigeo: '150134', nombre: 'San Luis' },
  { ubigeo: '150135', nombre: 'San Martin de Porres' },
  { ubigeo: '150136', nombre: 'San Miguel' },
  { ubigeo: '150137', nombre: 'Santa Anita' },
  { ubigeo: '150138', nombre: 'Santa Maria del Mar' },
  { ubigeo: '150139', nombre: 'Santa Rosa' },
  { ubigeo: '150140', nombre: 'Santiago de Surco' },
  { ubigeo: '150141', nombre: 'Surquillo' },
  { ubigeo: '150142', nombre: 'Villa El Salvador' },
  { ubigeo: '150143', nombre: 'Villa Maria del Triunfo' }
];

const WEEK_DAYS: WeekDay[] = [
  { key: 'lunes', label: 'Lunes', shortLabel: 'Lun' },
  { key: 'martes', label: 'Martes', shortLabel: 'Mar' },
  { key: 'miercoles', label: 'Miercoles', shortLabel: 'Mie' },
  { key: 'jueves', label: 'Jueves', shortLabel: 'Jue' },
  { key: 'viernes', label: 'Viernes', shortLabel: 'Vie' },
  { key: 'sabado', label: 'Sabado', shortLabel: 'Sab' },
  { key: 'domingo', label: 'Domingo', shortLabel: 'Dom' }
];

@Component({
  selector: 'app-sede-form-page',
  imports: [
    RouterLink,
    ReactiveFormsModule,
    AdminApprovalModalComponent,
    AppButtonComponent,
    AppCardComponent,
    AppInputComponent
  ],
  templateUrl: './sede-form-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SedeFormPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly sedesService = inject(SedesService);
  private readonly gerentesService = inject(GerentesService);
  private readonly authService = inject(AuthService);

  private readonly routeId = this.parseRouteId(this.route.snapshot.paramMap.get('id'));

  protected readonly isEditMode = signal(this.routeId !== null);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly approvalOpen = signal(false);
  protected readonly approvalLoading = signal(false);
  protected readonly approvalError = signal('');
  protected readonly errorMessage = signal('');
  protected readonly pendingPayload = signal<SedeRequest | null>(null);
  protected readonly districtOptions = DISTRICT_OPTIONS;
  protected readonly gerenteOptions = signal<GerenteDropdownItem[]>([]);
  protected readonly gerenteOptionsLoading = signal(false);
  protected readonly gerenteOptionsError = signal('');
  protected readonly generatedSedeEmail = signal('');
  protected readonly weekDays = WEEK_DAYS;
  protected readonly selectedDayKey = signal<string>('lunes');

  protected readonly form = this.formBuilder.group({
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    direccion: ['', [Validators.maxLength(255)]],
    ubigeo: ['150101', [Validators.required, Validators.pattern(/^\d{6}$/)]],
    telefono: ['', [Validators.required, Validators.pattern(/^9\d{8}$/)]],
    esAlmacenCentral: [false],
    estado: [true, [Validators.required]],
    idGerente: ['', [Validators.required]],
    horario: this.formBuilder.group({
      lunes: this.createDayScheduleGroup(),
      martes: this.createDayScheduleGroup(),
      miercoles: this.createDayScheduleGroup(),
      jueves: this.createDayScheduleGroup(),
      viernes: this.createDayScheduleGroup(),
      sabado: this.createDayScheduleGroup(),
      domingo: this.createDayScheduleGroup()
    })
  });

  constructor() {
    this.loadGerentes();

    this.form.controls.nombre.valueChanges.subscribe((nombre: string | null) => {
      this.generatedSedeEmail.set(this.buildSedeEmailPreview(nombre ?? ''));
    });
    this.generatedSedeEmail.set(this.buildSedeEmailPreview(this.form.controls.nombre.value ?? ''));

    if (this.isEditMode()) {
      this.loadSede();
    }
  }

  protected submit(): void {
    this.errorMessage.set('');

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage.set('Completa los campos requeridos antes de guardar la sede.');
      return;
    }

    const raw = this.form.getRawValue();

    const horarioConfig = this.buildHorarioConfig();

    if (!horarioConfig) {
      return;
    }

    const idGerente = this.parseIdGerente(raw.idGerente);

    const payload: SedeRequest = {
      nombre: raw.nombre ?? '',
      direccion: raw.direccion ?? '',
      ubigeo: raw.ubigeo ?? '',
      telefono: raw.telefono ?? '',
      esAlmacenCentral: Boolean(raw.esAlmacenCentral),
      estado: this.normalizeEstado(raw.estado),
      horarioConfig,
      idGerente: idGerente > 0 ? idGerente : null
    };

    this.pendingPayload.set(payload);
    this.approvalError.set('');
    this.approvalOpen.set(true);
  }

  protected displayGerenteLabel(item: GerenteDropdownItem): string {
    return item.nombreCompleto;
  }

  protected gerenteSelectionDisabled(): boolean {
    return this.gerenteOptionsLoading() || this.gerenteOptions().length === 0;
  }

  protected gerenteSelectionHelpText(): string {
    if (this.gerenteOptionsLoading()) {
      return 'Cargando gerentes activos...';
    }

    if (this.gerenteOptionsError().length > 0) {
      return this.gerenteOptionsError();
    }

    if (this.gerenteOptions().length === 0) {
      return 'No hay usuarios activos con rol GERENTE disponibles.';
    }

    return '';
  }

  protected selectedGerenteEmail(): string {
    const selectedId = this.parseIdGerente(this.form.controls.idGerente.value);
    if (selectedId <= 0) {
      return '';
    }

    const gerente = this.gerenteOptions().find((item) => item.idUsuario === selectedId);
    return gerente?.email?.trim() ?? '';
  }

  protected closeApprovalModal(): void {
    this.approvalOpen.set(false);
    this.approvalLoading.set(false);
    this.approvalError.set('');
    this.pendingPayload.set(null);
  }

  protected approveAndSave(credentials: { email: string; password: string }): void {
    const payload = this.pendingPayload();
    if (!payload) {
      this.closeApprovalModal();
      return;
    }

    this.approvalLoading.set(true);
    this.approvalError.set('');

    this.authService.validateAdminCredentials(credentials).subscribe({
      next: (adminSession) => this.saveSede(payload, adminSession.token),
      error: (error: unknown) => {
        this.approvalLoading.set(false);
        this.approvalError.set(this.resolveAdminApprovalError(error));
      }
    });
  }

  private saveSede(payload: SedeRequest, adminToken: string): void {
    if (!adminToken || adminToken.trim().length === 0) {
      this.saving.set(false);
      this.approvalLoading.set(false);
      this.approvalError.set('No se pudo obtener el token del administrador.');
      return;
    }

    this.saving.set(true);
    this.errorMessage.set('');

    const request$ = this.isEditMode() && this.routeId !== null
      ? this.sedesService.update(this.routeId, payload, adminToken)
      : this.sedesService.create(payload, adminToken);

    request$.pipe(finalize(() => {
      this.saving.set(false);
      this.approvalLoading.set(false);
      this.approvalOpen.set(false);
      this.pendingPayload.set(null);
    })).subscribe({
      next: (sede) => {
        const targetId = sede.idSede > 0 ? sede.idSede : (this.routeId ?? 0);
        if (targetId > 0) {
          void this.router.navigate(['/dashboard/administracion/sedes/detalle', targetId]);
          return;
        }

        void this.router.navigate(['/dashboard/administracion/sedes']);
      },
      error: (error: unknown) => {
        this.errorMessage.set(this.resolveError(error));
      }
    });
  }

  private loadGerentes(): void {
    this.gerenteOptionsLoading.set(true);
    this.gerenteOptionsError.set('');

    this.gerentesService
      .getActiveGerenteOptions()
      .pipe(finalize(() => this.gerenteOptionsLoading.set(false)))
      .subscribe({
      next: (data) => {
        this.gerenteOptions.set(
          [...data].sort((a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto, 'es'))
        );
      },
      error: () => {
        this.gerenteOptions.set([]);
        this.gerenteOptionsError.set('No se pudo cargar la lista de gerentes activos.');
      }
      });
  }

  private loadSede(): void {
    if (this.routeId === null) {
      this.errorMessage.set('No se encontro un id de sede valido para editar.');
      return;
    }

    this.loading.set(true);

    this.sedesService
      .getById(this.routeId)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (sede) => {
          const gerenteId = this.resolveGerenteIdFromResponse(sede);
          this.ensureGerenteOptionAvailable(sede, gerenteId);

          this.form.patchValue({
            nombre: sede.nombre,
            direccion: sede.direccion ?? '',
            ubigeo: sede.ubigeo ?? '',
            telefono: sede.telefono ?? '',
            esAlmacenCentral: sede.esAlmacenCentral,
            estado: this.normalizeEstado(sede.estado),
            idGerente: gerenteId > 0 ? String(gerenteId) : ''
          });

          this.generatedSedeEmail.set(this.buildSedeEmailPreview(sede.nombre));

          this.patchHorarioFromConfig(sede.horarioConfig);
        },
        error: (error: unknown) => {
          this.errorMessage.set(this.resolveError(error));
        }
      });
  }

  private resolveError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 400) {
        return this.resolveBackendValidationMessage(error);
      }

      if (error.status === 401) {
        const msg = this.resolveBackendValidationMessage(error);
        if (msg.includes('Datos de sede')) {
          return 'Las credenciales de administrador no son válidas.';
        }
        return msg;
      }

      if (error.status === 403) {
        return 'El email ADMIN no coincide con el del administrador que inició sesión.';
      }
    }

    return 'No se pudo completar la operacion de sedes.';
  }

  private resolveBackendValidationMessage(error: HttpErrorResponse): string {
    const body = error.error;
    if (body && typeof body === 'object') {
      const message = (body as Record<string, unknown>)['message'];
      if (typeof message === 'string' && message.trim().length > 0) {
        return message;
      }
    }

    return 'Datos de sede invalidos. Revisa nombre, gerente seleccionado y horario. Si el email generado ya existe, usa otro nombre de sede.';
  }

  private buildSedeEmailPreview(nombre: string): string {
    const normalizedName = nombre
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');

    if (normalizedName.length === 0) {
      return '';
    }

    return `sede.${normalizedName}@tiendasgo.com`;
  }

  private normalizeEstado(value: unknown): boolean {
    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      return normalized === 'true' || normalized === 'activo' || normalized === '1';
    }

    return false;
  }

  protected toggleDayClosed(dayKey: string): void {
    const group = this.getDayGroup(dayKey);
    if (!group) {
      return;
    }

    const closed = Boolean(group.controls['cerrado'].value);
    const currentOpen = String(group.controls['apertura'].value ?? '').trim();
    const currentClose = String(group.controls['cierre'].value ?? '').trim();
    group.patchValue({
      cerrado: !closed,
      apertura: closed ? (currentOpen.length > 0 ? currentOpen : '09:00') : '',
      cierre: closed ? (currentClose.length > 0 ? currentClose : '22:00') : ''
    });

    group.markAsTouched();
    group.updateValueAndValidity();
  }

  protected selectDay(dayKey: string): void {
    this.selectedDayKey.set(dayKey);
  }

  protected isSelectedDay(dayKey: string): boolean {
    return this.selectedDayKey() === dayKey;
  }

  protected isDayClosed(dayKey: string): boolean {
    const group = this.getDayGroup(dayKey);
    return Boolean(group?.controls['cerrado'].value);
  }

  protected dayHasError(dayKey: string): boolean {
    const group = this.getDayGroup(dayKey);
    if (!group) {
      return false;
    }

    return group.invalid && (group.touched || this.form.touched);
  }

  private createDayScheduleGroup(initial?: Partial<DaySchedule>): FormGroup {
    return this.formBuilder.group(
      {
        cerrado: [Boolean(initial?.cerrado ?? false)],
        apertura: [initial?.apertura ?? '09:00'],
        cierre: [initial?.cierre ?? '22:00']
      },
      {
        validators: [this.dayScheduleValidator()]
      }
    );
  }

  private dayScheduleValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const group = control as FormGroup;
      const closed = Boolean(group.get('cerrado')?.value);
      const openTime = String(group.get('apertura')?.value ?? '').trim();
      const closeTime = String(group.get('cierre')?.value ?? '').trim();

      if (closed) {
        return null;
      }

      if (!openTime || !closeTime) {
        return { requiredTimes: true };
      }

      if (openTime >= closeTime) {
        return { invalidRange: true };
      }

      return null;
    };
  }

  private getDayGroup(dayKey: string): FormGroup | null {
    const group = this.form.controls.horario.get(dayKey);
    return group instanceof FormGroup ? group : null;
  }

  private buildHorarioConfig(): Record<string, DaySchedule> | null {
    const horario: Record<string, DaySchedule> = {};

    for (const day of WEEK_DAYS) {
      const group = this.getDayGroup(day.key);
      if (!group) {
        continue;
      }

      group.markAsTouched();
      group.updateValueAndValidity();

      if (group.invalid) {
        this.errorMessage.set('Revisa el horario: faltan horas o el rango es invalido.');
        return null;
      }

      const closed = Boolean(group.controls['cerrado'].value);
      horario[day.key] = {
        cerrado: closed,
        apertura: closed ? '' : String(group.controls['apertura'].value ?? ''),
        cierre: closed ? '' : String(group.controls['cierre'].value ?? '')
      };
    }

    return horario;
  }

  private patchHorarioFromConfig(
    config: Record<string, unknown> | string | null | undefined
  ): void {
    if (!config) {
      return;
    }

    try {
      const parsed = typeof config === 'string'
        ? (config.trim().length > 0 ? JSON.parse(config) as Record<string, unknown> : null)
        : config;

      if (!parsed) {
        return;
      }

      for (const day of WEEK_DAYS) {
        const item = parsed[day.key] as Record<string, unknown> | undefined;
        if (!item || typeof item !== 'object') {
          continue;
        }

        const group = this.getDayGroup(day.key);
        if (!group) {
          continue;
        }

        const cerrado = this.toBoolean(item['cerrado']);
        const apertura = cerrado ? '' : (this.toHourString(item['apertura']) ?? '09:00');
        const cierre = cerrado ? '' : (this.toHourString(item['cierre']) ?? '22:00');

        group.patchValue({
          cerrado,
          apertura,
          cierre
        });
      }
    } catch {
      return;
    }
  }

  private toBoolean(value: unknown): boolean {
    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'number') {
      return value === 1;
    }

    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      return normalized === 'true' || normalized === '1';
    }

    return false;
  }

  private toHourString(value: unknown): string | null {
    if (typeof value !== 'string') {
      return null;
    }

    const normalized = value.trim();

    const exact24hMatch = normalized.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
    if (exact24hMatch) {
      return `${exact24hMatch[1]}:${exact24hMatch[2]}`;
    }

    const hhMmSsMatch = normalized.match(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)(?:\.\d+)?$/);
    if (hhMmSsMatch) {
      return `${hhMmSsMatch[1]}:${hhMmSsMatch[2]}`;
    }

    const twelveHourWithMinutesMatch = normalized.match(/^(1[0-2]|[1-9]):([0-5]\d)\s*([AaPp])\.?[Mm]\.?$/);
    if (twelveHourWithMinutesMatch) {
      const baseHour = Number(twelveHourWithMinutesMatch[1]);
      const minutes = twelveHourWithMinutesMatch[2];
      const meridiem = twelveHourWithMinutesMatch[3].toUpperCase();
      const normalizedHour = baseHour % 12 + (meridiem === 'P' ? 12 : 0);
      return `${normalizedHour.toString().padStart(2, '0')}:${minutes}`;
    }

    const twelveHourMatch = normalized.match(/^(1[0-2]|[1-9])\s*([AaPp])\.?[Mm]\.?$/);
    if (twelveHourMatch) {
      const baseHour = Number(twelveHourMatch[1]);
      const meridiem = twelveHourMatch[2].toUpperCase();
      const normalizedHour = baseHour % 12 + (meridiem === 'P' ? 12 : 0);
      return `${normalizedHour.toString().padStart(2, '0')}:00`;
    }

    return null;
  }

  private resolveAdminApprovalError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 401) {
        const body = error.error;
        if (body && typeof body === 'object') {
          const message = (body as Record<string, unknown>)['message'];
          if (typeof message === 'string' && message.trim().length > 0) {
            return message;
          }
        }
        return 'El email o contraseña del administrador no son válidos.';
      }

      if (error.status === 403) {
        return 'El email ADMIN no coincide con el del administrador que inició sesión.';
      }
    }

    if (error instanceof Error && error.message.length > 0) {
      return error.message;
    }

    return 'No se pudo validar la aprobacion de administrador.';
  }

  private parseRouteId(value: string | null): number | null {
    if (!value) {
      return null;
    }

    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  }

  private parseIdGerente(value: unknown): number {
    if (value === null || value === undefined || value === '') {
      return 0;
    }

    if (typeof value === 'number') {
      return Number.isInteger(value) && value > 0 ? value : 0;
    }

    if (typeof value === 'string') {
      const parsed = Number(value.trim());
      return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
    }

    return 0;
  }

  private resolveGerenteIdFromResponse(sede: SedeResponse): number {
    const idFromField = this.parseIdGerente(sede.idGerente);
    if (idFromField > 0) {
      return idFromField;
    }

    return this.parseIdGerente(sede.gerente?.idUsuario);
  }

  private ensureGerenteOptionAvailable(sede: SedeResponse, gerenteId: number): void {
    if (gerenteId <= 0) {
      return;
    }

    const exists = this.gerenteOptions().some((item) => item.idUsuario === gerenteId);
    if (exists) {
      return;
    }

    const nombre = sede.gerente?.nombreCompleto?.trim() || sede.gerenteNombre?.trim() || `Usuario #${gerenteId}`;
    const email = sede.gerente?.email?.trim() || sede.gerenteEmail?.trim() || undefined;

    this.gerenteOptions.update((items) => [
      ...items,
      {
        idUsuario: gerenteId,
        nombreCompleto: nombre,
        email,
        estado: sede.gerente?.estado
      }
    ]);
  }
}

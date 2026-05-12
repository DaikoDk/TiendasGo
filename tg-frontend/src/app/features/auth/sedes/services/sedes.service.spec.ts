import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { SedeRequest } from '../models/sede.models';
import { SedesService } from './sedes.service';

describe('SedesService', () => {
  let service: SedesService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SedesService, provideHttpClient(), provideHttpClientTesting()]
    });

    service = TestBed.inject(SedesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should send idGerente as source of truth without legacy manager fields', () => {
    const payload: SedeRequest = {
      nombre: 'Sede Norte',
      direccion: 'Av. Peru 123',
      ubigeo: '150101',
      telefono: '987654321',
      esAlmacenCentral: false,
      estado: true,
      horarioConfig: {
        lunes: { cerrado: false, apertura: '09:00', cierre: '18:00' }
      },
      idGerente: 12
    };

    service.create(payload).subscribe();

    const request = httpMock.expectOne((req) => req.method === 'POST' && req.url.endsWith('/api/sedes'));
    expect(request.request.body).toEqual(
      jasmine.objectContaining({
        nombre: 'Sede Norte',
        idGerente: 12
      })
    );
    expect(request.request.body.gerenteNombre).toBeUndefined();
    expect(request.request.body.gerenteEmail).toBeUndefined();

    request.flush({
      data: {
        idSede: 99,
        nombre: 'Sede Norte',
        idGerente: 12,
        estado: true,
        esAlmacenCentral: false,
        horarioConfig: {}
      }
    });
  });

  it('should map modern manager object and keep legacy fallback fields', () => {
    service.getById(33).subscribe((result) => {
      expect(result.idSede).toBe(33);
      expect(result.idGerente).toBe(8);
      expect(result.gerente?.nombreCompleto).toBe('Ana Perez');
      expect(result.gerenteNombre).toBe('Ana Perez');
      expect(result.gerenteEmail).toBe('ana@tiendasgo.com');
    });

    const request = httpMock.expectOne((req) => req.method === 'GET' && req.url.endsWith('/api/sedes/33'));
    request.flush({
      data: {
        idSede: 33,
        nombre: 'Sede Centro',
        gerente: {
          idUsuario: 8,
          nombreCompleto: 'Ana Perez',
          email: 'ana@tiendasgo.com',
          estado: true
        },
        estado: true,
        esAlmacenCentral: true,
        horarioConfig: {}
      }
    });
  });

  it('should keep legacy manager values when gerente object is absent', () => {
    service.getById(41).subscribe((result) => {
      expect(result.idGerente).toBe(5);
      expect(result.gerente).toBeNull();
      expect(result.gerenteNombre).toBe('Carlos Diaz');
      expect(result.gerenteEmail).toBe('carlos@tiendasgo.com');
    });

    const request = httpMock.expectOne((req) => req.method === 'GET' && req.url.endsWith('/api/sedes/41'));
    request.flush({
      data: {
        idSede: 41,
        nombre: 'Sede Sur',
        idGerente: 5,
        gerenteNombre: 'Carlos Diaz',
        gerenteEmail: 'carlos@tiendasgo.com',
        estado: true,
        esAlmacenCentral: false,
        horarioConfig: {}
      }
    });
  });
});

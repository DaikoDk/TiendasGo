import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';

import { GerentesService } from './gerentes.service';

describe('GerentesService', () => {
  let service: GerentesService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [GerentesService, provideHttpClient(), provideHttpClientTesting()]
    });

    service = TestBed.inject(GerentesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch only active gerente users for sede selector', () => {
    service.getActiveGerenteOptions().subscribe((items) => {
      expect(items.length).toBe(2);
      expect(items[0].nombreCompleto).toBe('Ana Perez');
      expect(items[1].nombreCompleto).toBe('Luis Rojas');
      expect(items.every((item) => item.estado === true)).toBeTrue();
    });

    const request = httpMock.expectOne(
      (req) => req.method === 'GET' && req.url.endsWith('/api/usuarios') && req.params.get('rol') === 'GERENTE'
    );

    request.flush({
      data: [
        {
          idUsuario: 2,
          nombreCompleto: 'Ana Perez',
          email: 'ana@tiendasgo.com',
          rol: 'GERENTE',
          estado: true,
          idSede: null,
          fechaCreacion: '2026-01-01T00:00:00Z'
        },
        {
          idUsuario: 3,
          nombreCompleto: 'Mario Soto',
          email: 'mario@tiendasgo.com',
          rol: 'GERENTE',
          estado: false,
          idSede: null,
          fechaCreacion: '2026-01-01T00:00:00Z'
        },
        {
          idUsuario: 4,
          nombreCompleto: 'Luis Rojas',
          email: 'luis@tiendasgo.com',
          rol: 'GERENTE',
          estado: true,
          idSede: 7,
          fechaCreacion: '2026-01-01T00:00:00Z'
        }
      ]
    });
  });
});

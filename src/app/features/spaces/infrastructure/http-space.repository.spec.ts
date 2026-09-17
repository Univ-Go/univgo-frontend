import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { APP_CONFIG, type AppConfig } from '../../../core/config/app-config';
import type { Space } from '../domain/space';
import { SpaceRepository } from '../domain/space.repository';
import { HttpSpaceRepository } from './http-space.repository';

const API_BASE_URL = 'http://localhost:3000';

const DATE = new Date(2026, 8, 17);

const CATALOG_PAYLOAD = [
  {
    spaceId: 'f2e1',
    name: 'Cancha de Tenis de Campo A',
    location: 'Complejo Deportivo Central',
    category: 'SPORTS',
    capacity: 4,
    underMaintenance: false,
    freeBlockStarts: ['06:00:00', '14:00:00'],
  },
];

describe('HttpSpaceRepository', () => {
  let repository: SpaceRepository;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: APP_CONFIG, useValue: { apiBaseUrl: API_BASE_URL } as AppConfig },
        { provide: SpaceRepository, useClass: HttpSpaceRepository },
      ],
    });

    repository = TestBed.inject(SpaceRepository);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  it('asks for the day in the user calendar rather than in UTC', () => {
    repository.catalog(new Date(2026, 0, 5)).subscribe();

    const request = controller.expectOne((candidate) => candidate.url === `${API_BASE_URL}/spaces`);

    expect(request.request.params.get('date')).toBe('2026-01-05');
    request.flush([]);
  });

  it('turns every free block into a window of one booking, translating the category', async () => {
    const spaces = new Promise<readonly Space[]>((resolve) =>
      repository.catalog(DATE).subscribe(resolve),
    );

    controller
      .expectOne((candidate) => candidate.url === `${API_BASE_URL}/spaces`)
      .flush(CATALOG_PAYLOAD);

    expect(await spaces).toEqual([
      {
        id: 'f2e1',
        name: 'Cancha de Tenis de Campo A',
        location: 'Complejo Deportivo Central',
        category: 'sports',
        capacity: 4,
        underMaintenance: false,
        freeSlots: [
          { date: DATE, from: 360, to: 480 },
          { date: DATE, from: 840, to: 960 },
        ],
      },
    ]);
  });

  it('answers with no space at all when the id is not in the catalogue', async () => {
    const space = new Promise<Space | null>((resolve) =>
      repository.findById('gone').subscribe(resolve),
    );

    controller
      .expectOne((candidate) => candidate.url === `${API_BASE_URL}/spaces`)
      .flush(CATALOG_PAYLOAD);

    expect(await space).toBeNull();
  });
});

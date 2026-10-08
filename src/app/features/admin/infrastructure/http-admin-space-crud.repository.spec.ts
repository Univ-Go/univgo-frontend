import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { APP_CONFIG, type AppConfig } from '../../../core/config/app-config';
import type { AdminSpaceDetail, SpaceType } from '../domain/admin-space-detail';
import { AdminSpaceCrudRepository } from '../domain/admin-space-crud.repository';
import type { PublishableSpaceDraft, SpacePhotoDraft } from '../domain/space-draft';
import { HttpAdminSpaceCrudRepository } from './http-admin-space-crud.repository';

const API_BASE_URL = 'http://localhost:3000';

const SPACE_ID = 'f2e1';

const TYPE_ID = 'f2c0f3d4-0000-4000-8000-000000000001';

function photo(name: string): SpacePhotoDraft {
  return {
    id: name,
    file: new File(['x'], name, { type: 'image/jpeg' }),
    previewUrl: `blob:${name}`,
  };
}

function publishable(photos: readonly SpacePhotoDraft[]): PublishableSpaceDraft {
  return {
    name: 'Gimnasio',
    location: 'Complejo central',
    spaceTypeId: TYPE_ID,
    capacity: 30,
    description: 'Sala de musculación.',
    rules: ['Usa toalla.'],
    schedules: [{ dayOfWeek: 1, fromMinutes: 6 * 60, toMinutes: 22 * 60 }],
    photos,
  };
}

function detailDto(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    spaceId: SPACE_ID,
    name: 'Gimnasio',
    location: 'Complejo central',
    spaceTypeId: TYPE_ID,
    spaceTypeName: 'Cancha',
    category: 'SPORTS',
    capacity: 30,
    scheduleWindowCount: 1,
    imageCount: 1,
    coverImageUrl: 'https://example.com/cover.jpg',
    archived: false,
    description: 'Sala de musculación.',
    rules: ['Usa toalla.'],
    archivedAt: null,
    schedules: [{ id: 'w1', dayOfWeek: 1, startTime: '06:00:00', endTime: '22:00:00' }],
    images: [
      { id: 'i1', position: 0, url: 'https://example.com/cover.jpg', width: 640, height: 480 },
    ],
    ...overrides,
  };
}

describe('HttpAdminSpaceCrudRepository', () => {
  let repository: AdminSpaceCrudRepository;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: APP_CONFIG, useValue: { apiBaseUrl: API_BASE_URL } as AppConfig },
        { provide: AdminSpaceCrudRepository, useClass: HttpAdminSpaceCrudRepository },
      ],
    });

    repository = TestBed.inject(AdminSpaceCrudRepository);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  it('leaves archived spaces out of the listing unless they are asked for', () => {
    repository.list(false).subscribe();

    controller.expectOne(`${API_BASE_URL}/admin/spaces?includeArchived=false`).flush([]);
  });

  it('reads the hours of a window as minutes from midnight', async () => {
    const detail = new Promise<AdminSpaceDetail>((resolve) =>
      repository.detail(SPACE_ID).subscribe(resolve),
    );

    controller.expectOne(`${API_BASE_URL}/admin/spaces/${SPACE_ID}`).flush(detailDto());

    expect((await detail).schedules[0]).toEqual({
      id: 'w1',
      dayOfWeek: 1,
      fromMinutes: 360,
      toMinutes: 1320,
    });
  });

  it('lowercases the category the server shouts', async () => {
    const detail = new Promise<AdminSpaceDetail>((resolve) =>
      repository.detail(SPACE_ID).subscribe(resolve),
    );

    controller.expectOne(`${API_BASE_URL}/admin/spaces/${SPACE_ID}`).flush(detailDto());

    expect((await detail).category).toBe('sports');
  });

  it('reads an archived space with the instant it was retired', async () => {
    const detail = new Promise<AdminSpaceDetail>((resolve) =>
      repository.detail(SPACE_ID).subscribe(resolve),
    );

    controller
      .expectOne(`${API_BASE_URL}/admin/spaces/${SPACE_ID}`)
      .flush(detailDto({ archived: true, archivedAt: '2026-10-07T09:30:00' }));

    const resolved = await detail;
    expect(resolved.archived).toBe(true);
    expect(resolved.archivedAt?.getHours()).toBe(9);
  });

  it('sends the whole space in one multipart request', () => {
    repository.create(publishable([photo('cover.jpg')])).subscribe();

    const request = controller.expectOne(`${API_BASE_URL}/admin/spaces`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toBeInstanceOf(FormData);

    request.flush(detailDto());
  });

  it('appends the photographs in the order the administrator arranged them', () => {
    repository.create(publishable([photo('first.jpg'), photo('second.jpg')])).subscribe();

    const request = controller.expectOne(`${API_BASE_URL}/admin/spaces`);
    const body = request.request.body as FormData;
    const names = body.getAll('photos').map((part) => (part as File).name);

    expect(names).toEqual(['first.jpg', 'second.jpg']);

    request.flush(detailDto());
  });

  it('marks the JSON part as JSON, or the server cannot bind it', () => {
    repository.create(publishable([photo('cover.jpg')])).subscribe();

    const request = controller.expectOne(`${API_BASE_URL}/admin/spaces`);
    const part = (request.request.body as FormData).get('space') as Blob;

    expect(part.type).toBe('application/json');

    request.flush(detailDto());
  });

  it('writes a window hour back as the server time format', () => {
    repository
      .replaceSchedules(SPACE_ID, [{ dayOfWeek: 3, fromMinutes: 390, toMinutes: 1290 }])
      .subscribe();

    const request = controller.expectOne(`${API_BASE_URL}/admin/spaces/${SPACE_ID}/schedules`);
    expect(request.request.body).toEqual({
      schedules: [{ dayOfWeek: 3, startTime: '06:30:00', endTime: '21:30:00' }],
    });

    request.flush([]);
  });

  it('sends a reorder as the full list of ids', () => {
    repository.reorderImages(SPACE_ID, ['b', 'a']).subscribe();

    const request = controller.expectOne(`${API_BASE_URL}/admin/spaces/${SPACE_ID}/images/order`);
    expect(request.request.body).toEqual({ imageIds: ['b', 'a'] });

    request.flush([]);
  });

  it('answers how many reservations archiving suspended', async () => {
    const suspended = new Promise<number>((resolve) =>
      repository.archive(SPACE_ID).subscribe(resolve),
    );

    controller
      .expectOne(`${API_BASE_URL}/admin/spaces/${SPACE_ID}/archive`)
      .flush({ suspendedReservations: 4 });

    expect(await suspended).toBe(4);
  });

  it('reads the space types with their category', async () => {
    const types = new Promise<readonly SpaceType[]>((resolve) =>
      repository.spaceTypes().subscribe(resolve),
    );

    controller
      .expectOne(`${API_BASE_URL}/admin/space-types`)
      .flush([{ id: TYPE_ID, name: 'Cancha', category: 'SPORTS' }]);

    expect(await types).toEqual([{ id: TYPE_ID, name: 'Cancha', category: 'sports' }]);
  });
});

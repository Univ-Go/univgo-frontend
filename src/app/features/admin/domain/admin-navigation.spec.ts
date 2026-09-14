import { withSpaceId } from './admin-navigation';

describe('withSpaceId', () => {
  it('swaps the space segment right after /admin/', () => {
    expect(withSpaceId('/admin/court-basketball-a/scan', 'court-basketball-a', 'study-room-b')).toBe(
      '/admin/study-room-b/scan',
    );
  });

  it('preserves trailing segments', () => {
    expect(
      withSpaceId('/admin/court-basketball-a/blocks/14-00', 'court-basketball-a', 'study-room-b'),
    ).toBe('/admin/study-room-b/blocks/14-00');
  });

  it('preserves the query string', () => {
    expect(
      withSpaceId(
        '/admin/court-basketball-a/blocks/14-00?date=2026-08-20',
        'court-basketball-a',
        'study-room-b',
      ),
    ).toBe('/admin/study-room-b/blocks/14-00?date=2026-08-20');
  });

  it('leaves the url untouched when the current space is not found in it', () => {
    const url = '/admin/study-room-b/scan';

    expect(withSpaceId(url, 'court-basketball-a', 'field-soccer-c')).toBe(url);
  });
});

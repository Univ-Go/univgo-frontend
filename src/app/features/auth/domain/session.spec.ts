import { type AuthenticatedUser, fullName, landingPathFor, roleFromNames } from './session';

describe('session', () => {
  describe('roleFromNames', () => {
    it('maps the backend student role to the domain vocabulary', () => {
      expect(roleFromNames(['STUDENT'])).toBe('student');
    });

    it('maps the backend admin role to the domain vocabulary', () => {
      expect(roleFromNames(['ADMIN'])).toBe('admin');
    });

    it('grants the wider capability when an account holds both roles', () => {
      expect(roleFromNames(['STUDENT', 'ADMIN'])).toBe('admin');
    });

    it('falls back to student for an unknown or empty role set', () => {
      expect(roleFromNames([])).toBe('student');
      expect(roleFromNames(['LIBRARIAN'])).toBe('student');
    });
  });

  describe('landingPathFor', () => {
    it('sends a student to the home view', () => {
      expect(landingPathFor('student')).toBe('/home');
    });

    it('sends an administrator to the panel', () => {
      expect(landingPathFor('admin')).toBe('/admin');
    });
  });

  it('builds a display name from both parts', () => {
    const user: AuthenticatedUser = {
      id: 'f2e1',
      identification: '1234567890',
      email: 'sofia.ramirez@univgo.edu',
      firstName: 'Sofía',
      lastName: 'Ramírez',
      role: 'student',
    };

    expect(fullName(user)).toBe('Sofía Ramírez');
  });
});


// Mock Authentication Service
// In production, this would communicate with the backend /auth endpoints

export type UserRole = 'ADMIN' | 'ENGINEER' | 'TECHNICIAN' | 'VIEWER';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  token: string;
}

const MOCK_USERS: Record<string, User> = {
  'admin': { id: 'u1', username: 'admin', role: 'ADMIN', token: 'mock-jwt-admin' },
  'engineer': { id: 'u2', username: 'engineer', role: 'ENGINEER', token: 'mock-jwt-engineer' },
  'tech': { id: 'u3', username: 'tech', role: 'TECHNICIAN', token: 'mock-jwt-tech' },
  'viewer': { id: 'u4', username: 'viewer', role: 'VIEWER', token: 'mock-jwt-viewer' },
};

export const AuthService = {
  login: async (username: string, password: string): Promise<User> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const user = MOCK_USERS[username.toLowerCase()];
        // Accept any password for demo
        if (user && password) {
          localStorage.setItem('auth_user', JSON.stringify(user));
          resolve(user);
        } else {
          reject(new Error('Invalid credentials'));
        }
      }, 800);
    });
  },

  logout: () => {
    localStorage.removeItem('auth_user');
  },

  getCurrentUser: (): User | null => {
    const stored = localStorage.getItem('auth_user');
    return stored ? JSON.parse(stored) : null;
  }
};

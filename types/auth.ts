export type UserRole = 'Owner' | 'Admin' | 'Member' | 'Viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  avatarUrl: string;
  role: UserRole;
  department?: string;
  createdAt: string;
}

export interface AuthSession {
  userId: string;
  token: string;
  expiresAt: string;
}

export interface UserProfileFormValues {
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  avatarUrl?: string;
}

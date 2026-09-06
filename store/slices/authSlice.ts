import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User, AuthSession, UserProfileFormValues, UserRole } from '@/types/auth';
import { STORAGE_KEYS } from '@/lib/storageKeys';
import { getData, setData, INITIAL_USERS } from '@/lib/storage';

interface AuthState {
  currentUser: User | null;
  session: AuthSession | null;
  mockUsers: User[];
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  currentUser: null,
  session: null,
  mockUsers: INITIAL_USERS,
  isAuthenticated: false,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    hydrateAuth: (state) => {
      const users = getData<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
      const session = getData<AuthSession | null>(STORAGE_KEYS.SESSION, null);
      state.mockUsers = users;
      state.session = session;

      // Only authenticated if a valid session exists in localStorage
      if (session && session.userId) {
        const found = users.find((u) => u.id === session.userId);
        if (found) {
          state.currentUser = found;
          state.isAuthenticated = true;
          return;
        }
      }
      state.currentUser = null;
      state.isAuthenticated = false;
    },
    login: (
      state,
      action: PayloadAction<{ email: string; password?: string }>
    ) => {
      const user = state.mockUsers.find(
        (u) => u.email.toLowerCase() === action.payload.email.toLowerCase()
      );
      if (user) {
        state.currentUser = user;
        state.isAuthenticated = true;
        state.session = {
          userId: user.id,
          token: 'sess_' + Date.now(),
          expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
        };
        setData(STORAGE_KEYS.SESSION, state.session);
      }
    },
    signup: (
      state,
      action: PayloadAction<{
        name: string;
        email: string;
        password?: string;
        avatarUrl?: string;
        department?: string;
      }>
    ) => {
      // Section 3: Every newly registered user must automatically receive 'Member'
      const newUser: User = {
        id: `user_${Date.now()}`,
        name: action.payload.name,
        email: action.payload.email,
        password: action.payload.password || 'Member@123',
        role: 'Member',
        avatarUrl:
          action.payload.avatarUrl ||
          `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
        department: action.payload.department || 'Product Engineering',
        createdAt: new Date().toISOString(),
      };
      state.mockUsers.push(newUser);
      state.currentUser = newUser;
      state.isAuthenticated = true;
      state.session = {
        userId: newUser.id,
        token: 'sess_' + Date.now(),
        expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
      };
      setData(STORAGE_KEYS.USERS, state.mockUsers);
      setData(STORAGE_KEYS.SESSION, state.session);
    },
    forgotPassword: (
      state,
      action: PayloadAction<{ email: string; newPassword: string }>
    ) => {
      const user = state.mockUsers.find(
        (u) => u.email.toLowerCase() === action.payload.email.toLowerCase()
      );
      if (user) {
        user.password = action.payload.newPassword;
        setData(STORAGE_KEYS.USERS, state.mockUsers);
      }
    },
    switchUser: (state, action: PayloadAction<string>) => {
      const user = state.mockUsers.find((u) => u.id === action.payload);
      if (user) {
        state.currentUser = user;
        state.isAuthenticated = true;
        state.session = {
          userId: user.id,
          token: 'sess_' + Date.now(),
          expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
        };
        setData(STORAGE_KEYS.SESSION, state.session);
      }
    },
    updateProfile: (state, action: PayloadAction<Partial<UserProfileFormValues>>) => {
      if (state.currentUser) {
        const { role, ...allowedUpdates } = action.payload;
        state.currentUser = {
          ...state.currentUser,
          ...allowedUpdates,
        };
        state.mockUsers = state.mockUsers.map((u) =>
          u.id === state.currentUser?.id ? state.currentUser! : u
        );
        setData(STORAGE_KEYS.USERS, state.mockUsers);
      }
    },
    updateUserRole: (
      state,
      action: PayloadAction<{ userId: string; newRole: UserRole }>
    ) => {
      if (state.currentUser?.role !== 'Owner' && state.currentUser?.role !== 'Admin') {
        return;
      }
      const target = state.mockUsers.find((u) => u.id === action.payload.userId);
      if (target) {
        target.role = action.payload.newRole;
        if (state.currentUser?.id === target.id) {
          state.currentUser.role = action.payload.newRole;
        }
        setData(STORAGE_KEYS.USERS, state.mockUsers);
      }
    },
    logout: (state) => {
      state.currentUser = null;
      state.session = null;
      state.isAuthenticated = false;
      setData(STORAGE_KEYS.SESSION, null);
    },
  },
});

export const {
  hydrateAuth,
  login,
  signup,
  forgotPassword,
  switchUser,
  updateProfile,
  updateUserRole,
  logout,
} = authSlice.actions;

export default authSlice.reducer;

import { create } from 'zustand';
import { authApi, tokenStore } from './api';

export interface AuthUser {
  id:               string;
  email:            string;
  name:             string;
  xp:               number;
  rank:             string;
  streak:           number;
  bestStreak:       number;
  dailyTargetType:  string;
  dailyTargetValue: number;
  authProvider:     string;
}

interface AuthState {
  user:        AuthUser | null;
  isLoading:   boolean;
  error:       string | null;
  isLoggedIn:  boolean;

  login:       (email: string, password: string)               => Promise<void>;
  register:    (email: string, name: string, password: string) => Promise<void>;
  googleLogin: (credential: string)                            => Promise<void>;
  logout:      ()                                              => Promise<void>;
  refresh:     ()                                              => Promise<boolean>;
  updateProfile: (data: Partial<AuthUser>)                     => Promise<void>;
  clearError:  ()                                              => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user:       null,
  isLoading:  true,   // true on app boot so we check for existing session
  error:      null,
  isLoggedIn: false,

  // ─── Login ──────────────────────────────────────────────────────────────────
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authApi.login(email, password);
      tokenStore.setAccess(data.accessToken);
      tokenStore.setRefresh(data.refreshToken);
      tokenStore.setUserId(data.user.id);
      set({ user: data.user, isLoggedIn: true, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Login failed', isLoading: false });
      throw err;
    }
  },

  // ─── Register ───────────────────────────────────────────────────────────────
  register: async (email, name, password) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authApi.register(email, name, password);
      tokenStore.setAccess(data.accessToken);
      tokenStore.setRefresh(data.refreshToken);
      tokenStore.setUserId(data.user.id);
      set({ user: data.user, isLoggedIn: true, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Registration failed', isLoading: false });
      throw err;
    }
  },

  // ─── Google Login ────────────────────────────────────────────────────────────
  googleLogin: async (credential) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authApi.googleLogin(credential);
      tokenStore.setAccess(data.accessToken);
      tokenStore.setRefresh(data.refreshToken);
      tokenStore.setUserId(data.user.id);
      set({ user: data.user, isLoggedIn: true, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Google sign-in failed', isLoading: false });
      throw err;
    }
  },

  // ─── Logout ─────────────────────────────────────────────────────────────────
  logout: async () => {
    const refresh = tokenStore.getRefresh();
    if (refresh) authApi.logout(refresh).catch(() => {});
    tokenStore.clear();
    set({ user: null, isLoggedIn: false });
  },

  // ─── Refresh session on app boot ────────────────────────────────────────────
  refresh: async () => {
    const refreshToken = tokenStore.getRefresh();
    const userId       = tokenStore.getUserId();

    if (!refreshToken || !userId) {
      set({ isLoading: false });
      return false;
    }

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/auth/refresh`,
        {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ refreshToken, userId }),
        }
      );

      if (!res.ok) {
        tokenStore.clear();
        set({ isLoading: false });
        return false;
      }

      const tokens = await res.json();
      tokenStore.setAccess(tokens.accessToken);
      tokenStore.setRefresh(tokens.refreshToken);

      const user = await authApi.me();
      set({ user, isLoggedIn: true, isLoading: false });
      return true;
    } catch {
      tokenStore.clear();
      set({ isLoading: false });
      return false;
    }
  },

  // ─── Update profile ──────────────────────────────────────────────────────────
  updateProfile: async (data) => {
    const updated = await authApi.updateMe(data);
    set(s => ({ user: s.user ? { ...s.user, ...updated } : null }));
  },

  clearError: () => set({ error: null }),
}));

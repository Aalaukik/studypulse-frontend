// ─── API Client ───────────────────────────────────────────────────────────────
// Wraps fetch with auth headers, automatic token refresh, and typed responses.

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// ─── Token storage ─────────────────────────────────────────────────────────────
// Tokens live in memory (accessToken) + localStorage (refreshToken + userId).
// Memory storage for access token prevents XSS reading it from localStorage.

let _accessToken: string | null = null;

export const tokenStore = {
  getAccess:    ()      => _accessToken,
  setAccess:    (t: string) => { _accessToken = t; },
  clearAccess:  ()      => { _accessToken = null; },

  getRefresh:   ()      => localStorage.getItem('sp_refresh'),
  setRefresh:   (t: string) => localStorage.setItem('sp_refresh', t),
  clearRefresh: ()      => localStorage.removeItem('sp_refresh'),

  getUserId:    ()      => localStorage.getItem('sp_uid'),
  setUserId:    (id: string) => localStorage.setItem('sp_uid', id),
  clearUserId:  ()      => localStorage.removeItem('sp_uid'),

  clear: () => {
    _accessToken = null;
    localStorage.removeItem('sp_refresh');
    localStorage.removeItem('sp_uid');
  },
};

// ─── Token refresh ─────────────────────────────────────────────────────────────

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  // Deduplicate concurrent refresh calls
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = tokenStore.getRefresh();
    const userId       = tokenStore.getUserId();
    if (!refreshToken || !userId) return null;

    try {
      const res = await fetch(`${BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken, userId }),
      });
      if (!res.ok) {
        tokenStore.clear();
        return null;
      }
      const data = await res.json();
      tokenStore.setAccess(data.accessToken);
      tokenStore.setRefresh(data.refreshToken);
      return data.accessToken as string;
    } catch {
      tokenStore.clear();
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// ─── Core fetch wrapper ────────────────────────────────────────────────────────

type FetchOptions = RequestInit & { skipAuth?: boolean; _retry?: boolean };

async function apiFetch<T>(path: string, opts: FetchOptions = {}): Promise<T> {
  const { skipAuth, _retry, ...fetchOpts } = opts;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOpts.headers as Record<string, string>),
  };

  if (!skipAuth) {
    let token = tokenStore.getAccess();
    if (!token) token = await refreshAccessToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...fetchOpts, headers });

  // Auto-refresh on 401 TOKEN_EXPIRED
  if (res.status === 401 && !_retry && !skipAuth) {
    const body = await res.json().catch(() => ({}));
    if (body.code === 'TOKEN_EXPIRED') {
      const newToken = await refreshAccessToken();
      if (newToken) {
        return apiFetch<T>(path, { ...opts, _retry: true });
      }
    }
    // Auth completely failed — dispatch event so UI can redirect to login
    window.dispatchEvent(new Event('auth:logout'));
    throw new ApiError(401, 'Unauthorized');
  }

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiError(res.status, errBody.error || res.statusText, errBody);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

export class ApiError extends Error {
  constructor(public status: number, message: string, public body?: any) {
    super(message);
    this.name = 'ApiError';
  }
}

// ─── Convenience helpers ───────────────────────────────────────────────────────

const get  = <T>(path: string)         => apiFetch<T>(path, { method: 'GET' });
const post = <T>(path: string, data: any) => apiFetch<T>(path, { method: 'POST', body: JSON.stringify(data) });
const patch = <T>(path: string, data: any) => apiFetch<T>(path, { method: 'PATCH', body: JSON.stringify(data) });
const del  = <T>(path: string)         => apiFetch<T>(path, { method: 'DELETE' });

// ─── Auth ──────────────────────────────────────────────────────────────────────

export const authApi = {
  register: (email: string, name: string, password: string) =>
    apiFetch<{ accessToken: string; refreshToken: string; user: any }>(
      '/api/auth/register', { method: 'POST', skipAuth: true, body: JSON.stringify({ email, name, password }) }
    ),
  login: (email: string, password: string) =>
    apiFetch<{ accessToken: string; refreshToken: string; user: any }>(
      '/api/auth/login', { method: 'POST', skipAuth: true, body: JSON.stringify({ email, password }) }
    ),
  logout:  (refreshToken: string) => post('/api/auth/logout', { refreshToken }),
  me:      ()                     => get<any>('/api/auth/me'),
  updateMe: (data: any)           => patch<any>('/api/auth/me', data),
};

// ─── Subjects ─────────────────────────────────────────────────────────────────

export const subjectsApi = {
  list:   ()                 => get<any[]>('/api/v1/subjects'),
  create: (data: any)        => post<any>('/api/v1/subjects', data),
  update: (id: string, data: any) => patch<any>(`/api/v1/subjects/${id}`, data),
  delete: (id: string)       => del<any>(`/api/v1/subjects/${id}`),
};

// ─── Goals ────────────────────────────────────────────────────────────────────

export const goalsApi = {
  list:     (params?: { status?: string; subjectId?: string }) => {
    const qs = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return get<any[]>(`/api/v1/goals${qs}`);
  },
  create:   (data: any)            => post<any>('/api/v1/goals', data),
  update:   (id: string, data: any) => patch<any>(`/api/v1/goals/${id}`, data),
  complete: (id: string)           => patch<any>(`/api/v1/goals/${id}`, { status: 'completed' }),
  delete:   (id: string)           => del<any>(`/api/v1/goals/${id}`),
};

// ─── Review Cards ─────────────────────────────────────────────────────────────

export const reviewCardsApi = {
  list:    (params?: { dueOnly?: boolean; subjectId?: string }) => {
    const qs = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return get<any[]>(`/api/v1/review-cards${qs}`);
  },
  create:  (data: any)              => post<any>('/api/v1/review-cards', data),
  rate:    (id: string, rating: string) => post<any>(`/api/v1/review-cards/${id}/rate`, { rating }),
  delete:  (id: string)             => del<any>(`/api/v1/review-cards/${id}`),
};

// ─── Exams ────────────────────────────────────────────────────────────────────

export const examsApi = {
  list:   ()           => get<any[]>('/api/v1/exams'),
  create: (data: any)  => post<any>('/api/v1/exams', data),
  delete: (id: string) => del<any>(`/api/v1/exams/${id}`),
};

// ─── Sessions ─────────────────────────────────────────────────────────────────

export const sessionsApi = {
  list:   (params?: { date?: string; limit?: number }) => {
    const qs = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return get<any[]>(`/api/v1/sessions${qs}`);
  },
  create: (data: any) => post<any>('/api/v1/sessions', data),
};

// ─── Mistakes ─────────────────────────────────────────────────────────────────

export const mistakesApi = {
  list:   (subjectId?: string) => get<any[]>(`/api/v1/mistakes${subjectId ? `?subjectId=${subjectId}` : ''}`),
  create: (data: any)          => post<any>('/api/v1/mistakes', data),
  delete: (id: string)         => del<any>(`/api/v1/mistakes/${id}`),
};

// ─── Energy ───────────────────────────────────────────────────────────────────

export const energyApi = {
  list:        ()           => get<any[]>('/api/v1/energy'),
  log:         (level: number) => post<any>('/api/v1/energy', { energyLevel: level }),
  whatWorked:  (note: string)  => patch<any>('/api/v1/energy/today/what-worked', { whatWorked: note }),
};

// ─── Past Papers ──────────────────────────────────────────────────────────────

export const papersApi = {
  list:   ()           => get<any[]>('/api/v1/papers'),
  create: (data: any)  => post<any>('/api/v1/papers', data),
  delete: (id: string) => del<any>(`/api/v1/papers/${id}`),
};

// ─── Weekly Reviews ───────────────────────────────────────────────────────────

export const weeklyReviewsApi = {
  list:     () => get<any[]>('/api/v1/weekly-reviews'),
  generate: () => post<any>('/api/v1/weekly-reviews/generate', {}),
};

// ─── XP ───────────────────────────────────────────────────────────────────────

export const xpApi = {
  list: () => get<any[]>('/api/v1/xp'),
};

// ─── Challenges ───────────────────────────────────────────────────────────────

export const challengesApi = {
  active:   ()           => get<any>('/api/v1/challenges/active'),
  start:    (data: any)  => post<any>('/api/v1/challenges', data),
  complete: (id: string) => post<any>(`/api/v1/challenges/${id}/complete`, {}),
};

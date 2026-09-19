export const USERS_STATE_STORAGE_KEY = 'users_state';

export const storageService = {
  getItem(key: string) {
    return localStorage.getItem(key);
  },
  setItem(key: string, value: string) {
    localStorage.setItem(key, value);
  },
  removeItem(key: string) {
    localStorage.removeItem(key);
  },
  getJson<T>(key: string): T | null {
    const raw = this.getItem(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },
  setJson<T>(key: string, value: T) {
    this.setItem(key, JSON.stringify(value));
  },
};

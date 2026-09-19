import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { apiService, ApiError } from '../services/apiService';
import { storageService, USERS_STATE_STORAGE_KEY } from '../services/storageService';

export type UserData = {
  uid: string;
  jwt: string;
  name: string;
  email: string;
  avatar: string | null;
  verified: boolean;
  roles: string[];
};

type UserState = {
  users: UserData[];
  activeUid: string | null;
};

export type LoginResult = {
  success: boolean;
  message?: string;
};

function isValidUser(user: unknown): user is UserData {
  if (!user || typeof user !== 'object') return false;
  const candidate = user as Record<string, unknown>;
  return (
    typeof candidate.uid === 'string' &&
    typeof candidate.jwt === 'string' &&
    typeof candidate.name === 'string' &&
    typeof candidate.email === 'string' &&
    Array.isArray(candidate.roles)
  );
}

function extractErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Ha ocurrido un error inesperado';
}

function loadInitialState(): UserState {
  const parsed = storageService.getJson<Partial<UserState>>(USERS_STATE_STORAGE_KEY);
  if (!parsed) return { users: [], activeUid: null };

  const users = Array.isArray(parsed.users) ? parsed.users.filter(isValidUser) : [];
  const activeUid =
    typeof parsed.activeUid === 'string' && users.some((user) => user.uid === parsed.activeUid)
      ? parsed.activeUid
      : (users[0]?.uid ?? null);

  return { users, activeUid };
}

const UserContext = createContext<{
  users: UserData[];
  activeUid: string | null;
  activeUser: UserData | null;
  isLoggedIn: boolean;
  hasMasterAccess: boolean;
  hasAdminAccess: boolean;
  getUserByUid: (uid: string) => UserData | null;
  saveUser: (user: UserData, setAsActive?: boolean) => void;
  setActiveUser: (uid: string) => boolean;
  removeUser: (uid: string) => void;
  logout: (uid?: string) => void;
  loginPassword: (user: string, password: string) => Promise<LoginResult>;
  getGoogleClientId: (forceRefresh?: boolean) => Promise<string>;
  loginGoogle: (idToken: string) => Promise<LoginResult>;
  loginAdmin: (uid: string) => Promise<LoginResult>;
  updateSettings: (payload: { name?: string; password?: string; avatar?: File }) => Promise<{
    success: boolean;
    message?: string;
    user?: UserData;
  }>;
  deleteActiveUser: () => Promise<{ success: boolean; message?: string; deleteOn?: string }>;
} | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<UserState>(() => loadInitialState());
  const googleClientIdRef = useRef<string | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  const persist = useCallback((next: UserState) => {
    const validActiveUid =
      next.activeUid && next.users.some((user) => user.uid === next.activeUid)
        ? next.activeUid
        : (next.users[0]?.uid ?? null);

    const normalized: UserState = { users: next.users, activeUid: validActiveUid };
    storageService.setJson(USERS_STATE_STORAGE_KEY, normalized);
    setState(normalized);
    return normalized;
  }, []);

  const refreshUser = useCallback(
    async (uid: string) => {
      const user = stateRef.current.users.find((item) => item.uid === uid);
      if (!user) return;

      try {
        const response = await apiService.get<{ message: string; user: UserData }>('me');
        if (isValidUser(response.user)) {
          const users = [...stateRef.current.users];
          const index = users.findIndex((item) => item.uid === response.user.uid);
          if (index >= 0) users[index] = response.user;
          persist({ users, activeUid: stateRef.current.activeUid });
        }
      } catch (error) {
        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          const users = stateRef.current.users.filter((item) => item.uid !== uid);
          const activeUid = stateRef.current.activeUid === uid ? (users[0]?.uid ?? null) : stateRef.current.activeUid;
          persist({ users, activeUid });
        }
      }
    },
    [persist]
  );

  useEffect(() => {
    if (state.activeUid) {
      void refreshUser(state.activeUid);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveUser = useCallback(
    (user: UserData, setAsActive = false) => {
      if (!isValidUser(user)) return;
      const users = [...stateRef.current.users];
      const index = users.findIndex((item) => item.uid === user.uid);
      if (index >= 0) users[index] = user;
      else users.push(user);

      const shouldSetActive = setAsActive || !stateRef.current.activeUid;
      const activeUid = shouldSetActive ? user.uid : stateRef.current.activeUid;
      persist({ users, activeUid });
    },
    [persist]
  );

  const setActiveUser = useCallback(
    (uid: string) => {
      const exists = stateRef.current.users.some((user) => user.uid === uid);
      if (!exists) return false;
      persist({ users: stateRef.current.users, activeUid: uid });
      void refreshUser(uid);
      return true;
    },
    [persist, refreshUser]
  );

  const removeUser = useCallback(
    (uid: string) => {
      const users = stateRef.current.users.filter((user) => user.uid !== uid);
      const activeUid = stateRef.current.activeUid === uid ? (users[0]?.uid ?? null) : stateRef.current.activeUid;
      persist({ users, activeUid });
    },
    [persist]
  );

  const logout = useCallback(
    (uid?: string) => {
      const targetUid = uid ?? stateRef.current.activeUid;
      if (!targetUid) return;
      const users = stateRef.current.users.filter((user) => user.uid !== targetUid);
      const activeUid = stateRef.current.activeUid === targetUid ? (users[0]?.uid ?? null) : stateRef.current.activeUid;
      persist({ users, activeUid });
      if (activeUid) void refreshUser(activeUid);
    },
    [persist, refreshUser]
  );

  const loginPassword = useCallback(
    async (user: string, password: string): Promise<LoginResult> => {
      try {
        const response = await apiService.post<{ message: string; user: UserData }>('login', { user, password });
        if (!isValidUser(response.user)) return { success: false, message: 'Respuesta de usuario inválida' };
        saveUser(response.user, true);
        return { success: true };
      } catch (error) {
        return { success: false, message: extractErrorMessage(error) };
      }
    },
    [saveUser]
  );

  const getGoogleClientId = useCallback(async (forceRefresh = false): Promise<string> => {
    if (!forceRefresh && googleClientIdRef.current) return googleClientIdRef.current;

    const response = await apiService.get<{ message: string; google_client_id?: string }>('login/google');
    const clientId = typeof response.google_client_id === 'string' ? response.google_client_id.trim() : '';
    if (!clientId) throw new Error('Google OAuth no está configurado');
    googleClientIdRef.current = clientId;
    return clientId;
  }, []);

  const loginGoogle = useCallback(
    async (idToken: string): Promise<LoginResult> => {
      const normalizedToken = idToken.trim();
      if (!normalizedToken) return { success: false, message: 'El token de Google es obligatorio' };

      try {
        const response = await apiService.post<{ message: string; user: UserData }>('login/google', {
          id_token: normalizedToken,
        });
        if (!isValidUser(response.user)) return { success: false, message: 'Respuesta de usuario inválida' };
        saveUser(response.user, true);
        return { success: true };
      } catch (error) {
        return { success: false, message: extractErrorMessage(error) };
      }
    },
    [saveUser]
  );

  const loginAdmin = useCallback(
    async (uid: string): Promise<LoginResult> => {
      const normalizedUid = uid.trim();
      if (!normalizedUid) return { success: false, message: 'El uid es obligatorio' };

      try {
        const response = await apiService.post<{ message: string; user: UserData }>('login/admin', {
          uid: normalizedUid,
        });
        if (!isValidUser(response.user)) return { success: false, message: 'Respuesta de usuario inválida' };
        saveUser(response.user, true);
        return { success: true };
      } catch (error) {
        return { success: false, message: extractErrorMessage(error) };
      }
    },
    [saveUser]
  );

  const updateSettings = useCallback(
    async (payload: { name?: string; password?: string; avatar?: File }) => {
      const activeUser = stateRef.current.users.find((user) => user.uid === stateRef.current.activeUid) ?? null;
      if (!activeUser) return { success: false, message: 'No autorizado' };

      const normalizedName = typeof payload.name === 'string' ? payload.name.trim() : '';
      const normalizedPassword = typeof payload.password === 'string' ? payload.password.trim() : '';
      const body: { name?: string; password?: string } = {};
      if (normalizedName) body.name = normalizedName;
      if (normalizedPassword) body.password = normalizedPassword;

      const hasAvatar = payload.avatar instanceof File;
      if (!hasAvatar && !body.name && !body.password) {
        return { success: false, message: 'No hay cambios para guardar' };
      }

      try {
        const response = hasAvatar
          ? await apiService.postWithFiles<{ message: string; user: Omit<UserData, 'jwt'> & { jwt?: string } }>(
              'update-settings',
              body,
              { avatar: payload.avatar as File }
            )
          : await apiService.post<{ message: string; user: Omit<UserData, 'jwt'> & { jwt?: string } }>(
              'update-settings',
              body
            );

        const updatedUser: UserData = { ...activeUser, ...response.user, jwt: response.user.jwt ?? activeUser.jwt };
        if (!isValidUser(updatedUser)) return { success: false, message: 'Respuesta de usuario inválida' };

        saveUser(updatedUser, true);
        return { success: true, message: response.message, user: updatedUser };
      } catch (error) {
        return { success: false, message: extractErrorMessage(error) };
      }
    },
    [saveUser]
  );

  const deleteActiveUser = useCallback(async () => {
    const activeUser = stateRef.current.users.find((user) => user.uid === stateRef.current.activeUid) ?? null;
    if (!activeUser) return { success: false, message: 'No autorizado' };

    try {
      const response = await apiService.delete<{ message: string; delete_on?: string }>('delete-user');
      logout(activeUser.uid);
      return { success: true, message: response.message, deleteOn: response.delete_on };
    } catch (error) {
      return { success: false, message: extractErrorMessage(error) };
    }
  }, [logout]);

  const activeUser = useMemo(
    () => state.users.find((user) => user.uid === state.activeUid) ?? null,
    [state.users, state.activeUid]
  );

  const value = useMemo(
    () => ({
      users: state.users,
      activeUid: state.activeUid,
      activeUser,
      isLoggedIn: activeUser !== null,
      hasMasterAccess: activeUser ? activeUser.roles.includes('master') || activeUser.roles.includes('admin') : false,
      hasAdminAccess: activeUser ? activeUser.roles.includes('admin') : false,
      getUserByUid: (uid: string) => state.users.find((user) => user.uid === uid) ?? null,
      saveUser,
      setActiveUser,
      removeUser,
      logout,
      loginPassword,
      getGoogleClientId,
      loginGoogle,
      loginAdmin,
      updateSettings,
      deleteActiveUser,
    }),
    [
      state.users,
      state.activeUid,
      activeUser,
      saveUser,
      setActiveUser,
      removeUser,
      logout,
      loginPassword,
      getGoogleClientId,
      loginGoogle,
      loginAdmin,
      updateSettings,
      deleteActiveUser,
    ]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser debe usarse dentro de UserProvider');
  return context;
}

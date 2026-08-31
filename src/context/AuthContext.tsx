/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '../types';
import { callBackendFunction } from '../lib/insforgeApi';
import { enrichUserFromApi, defaultPermissionsForRole } from '../lib/permissions';
import { v4 as uuidv4 } from 'uuid';

interface AuthState {
  currentUser: User | null;
  users: User[];
  /** True jusqu’à la fin du premier chargement users_list (InsForge) */
  usersLoading: boolean;
  /** Si la liste ne peut pas être chargée depuis le serveur */
  usersError: string | null;
  login: (username: string, pass: string) => Promise<boolean>;
  logout: () => void;
  addUser: (u: Omit<User, 'id'>) => Promise<void>;
  updateUser: (id: string, updates: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

const DEFAULT_USERS: User[] = [
  {
    id: uuidv4(),
    nom: 'Administrateur',
    username: 'admin',
    passwordHash: 'admin',
    role: 'Admin',
    actif: true,
    permissions: defaultPermissionsForRole('Admin'),
  },
];

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('ivoire_users');
    return saved ? JSON.parse(saved) : DEFAULT_USERS;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('ivoire_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [usersLoading, setUsersLoading] = useState<boolean>(() => {
    const savedUsers = localStorage.getItem('ivoire_users');
    const savedCurrentUser = localStorage.getItem('ivoire_current_user');
    return !savedUsers && !savedCurrentUser;
  });
  const [usersError, setUsersError] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('ivoire_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    // Récupère la liste des utilisateurs depuis InsForge en arrière-plan.
    (async () => {
      try {
        const res = await callBackendFunction<{ users: Record<string, unknown>[] }>('users_list', {});
        if (res.users) {
          const enriched = res.users.map((u) => enrichUserFromApi(u as never));
          setUsers(enriched);
          setCurrentUser((prev) => {
            if (!prev) return null;
            const updated = enriched.find((u) => u.id === prev.id);
            return updated || prev;
          });
        }
      } catch (e) {
        setUsersError((e as Error).message || 'Impossible de charger les utilisateurs depuis le serveur.');
      } finally {
        setUsersLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('ivoire_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('ivoire_current_user');
    }
  }, [currentUser]);

  const login = async (username: string, pass: string) => {
    try {
      const res = await callBackendFunction<{ user: Record<string, unknown> }>('login', {
        username,
        password: pass,
      });
      if (res.user && res.user.actif) {
        const u = enrichUserFromApi(res.user as never);
        setCurrentUser(u);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const addUser = async (u: Omit<User, 'id'>) => {
    const payload = {
      nom: u.nom,
      username: u.username,
      telephone: u.telephone,
      passwordHash: u.passwordHash,
      role: u.role,
      actif: u.actif ?? true,
      permissions: u.permissions ?? defaultPermissionsForRole(u.role),
    };
    const res = await callBackendFunction<{ user: Record<string, unknown> }>('users_add', payload);
    const nu = enrichUserFromApi(res.user as never);
    setUsers((prev) => [...prev, nu]);
  };

  const updateUser = async (id: string, updates: Partial<User>) => {
    const payload = {
      id,
      updates: {
        ...updates,
      },
    };
    const res = await callBackendFunction<{ user: Record<string, unknown> }>('users_update', payload);
    const nu = enrichUserFromApi(res.user as never);

    setUsers((prev) => prev.map((u) => (u.id === id ? nu : u)));
    if (currentUser && currentUser.id === id) {
      setCurrentUser(nu);
    }
  };

  const deleteUser = async (id: string) => {
    await callBackendFunction('users_delete', { id });
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };


  return (
    <AuthContext.Provider
      value={{ currentUser, users, usersLoading, usersError, login, logout, addUser, updateUser, deleteUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

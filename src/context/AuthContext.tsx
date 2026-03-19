/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '../types';
import { callInsforgeFunction } from '../lib/insforgeApi';
import { v4 as uuidv4 } from 'uuid';

interface AuthState {
  currentUser: User | null;
  users: User[];
  login: (username: string, pass: string) => Promise<boolean>;
  logout: () => void;
  addUser: (u: Omit<User, 'id'>) => Promise<void>;
  updateUser: (id: string, updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

const DEFAULT_USERS: User[] = [
  { id: uuidv4(), nom: 'Administrateur', username: 'admin', passwordHash: 'admin', role: 'Admin', actif: true }
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

  useEffect(() => {
    // Cache local pour éviter une mauvaise UX au rechargement.
    localStorage.setItem('ivoire_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    // Récupère la liste des utilisateurs depuis InsForge.
    // Si ça échoue, on garde le cache local.
    (async () => {
      try {
        const res = await callInsforgeFunction<{ users: User[] }>('users_list', {})
        setUsers(res.users)
      } catch {
        // no-op (fallback localStorage)
      }
    })()
  }, [])

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('ivoire_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('ivoire_current_user');
    }
  }, [currentUser]);

  const login = async (username: string, pass: string) => {
    try {
      const res = await callInsforgeFunction<{ user: User }>('login', { username, password: pass })
      if (res.user && res.user.actif) {
        setCurrentUser(res.user)
        return true
      }
      return false
    } catch {
      return false
    }
  }

  const logout = () => {
    setCurrentUser(null);
  };

  const addUser = async (u: Omit<User, 'id'>) => {
    const res = await callInsforgeFunction<{ user: User }>('users_add', u)
    setUsers(prev => [...prev, res.user])
  }

  const updateUser = async (id: string, updates: Partial<User>) => {
    const payload = {
      id,
      updates: {
        ...updates,
      },
    }
    const res = await callInsforgeFunction<{ user: User }>('users_update', payload)

    setUsers(prev => prev.map(u => (u.id === id ? res.user : u)))
    if (currentUser && currentUser.id === id) {
      setCurrentUser(res.user)
    }
  }

  return (
    <AuthContext.Provider value={{ currentUser, users, login, logout, addUser, updateUser }}>
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

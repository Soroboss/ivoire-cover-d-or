import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface AuthState {
  currentUser: User | null;
  users: User[];
  login: (username: string, pass: string) => boolean;
  logout: () => void;
  addUser: (u: Omit<User, 'id'>) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
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
    localStorage.setItem('ivoire_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('ivoire_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('ivoire_current_user');
    }
  }, [currentUser]);

  const login = (username: string, pass: string) => {
    const user = users.find(u => u.username === username && u.passwordHash === pass);
    if (user && user.actif) {
      setCurrentUser(user);
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const addUser = (u: Omit<User, 'id'>) => {
    setUsers([...users, { ...u, id: uuidv4() }]);
  };

  const updateUser = (id: string, updates: Partial<User>) => {
    setUsers(users.map(u => u.id === id ? { ...u, ...updates } : u));
    if (currentUser && currentUser.id === id) {
       setCurrentUser({ ...currentUser, ...updates } as User);
    }
  };

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

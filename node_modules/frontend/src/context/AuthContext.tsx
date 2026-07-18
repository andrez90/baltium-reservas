import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'RECEPTION' | 'WAITER' | 'CASHIER' | 'CUSTOMER';
  tenantId?: string | null;
  is2faEnabled: boolean;
}

export interface Tenant {
  id: string;
  name: string;
  logo?: string | null;
  primaryColor: string;
  secondaryColor: string;
  domain: string;
  schedule: string;
  tableCount: number;
  capacity: number;
  configuration: string;
}

export type TableStatus = 'AVAILABLE' | 'RESERVED' | 'OCCUPIED' | 'CLEANING' | 'OUT_OF_SERVICE';

export interface Table {
  id: string;
  name: string;
  capacity: number;
  status: TableStatus;
  x: number;
  y: number;
  width: number;
  height: number;
  shape: string;
  zone: string;
}

interface AuthContextType {
  user: User | null;
  tenant: Tenant | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateTenantColors: (primary: string, secondary: string) => void;
  syncProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);

  // Apply colors to document body
  const applyColors = (primary: string, secondary: string) => {
    const root = document.documentElement;
    root.style.setProperty('--primary-color', primary);
    root.style.setProperty('--secondary-color', secondary);
    
    // Auto calculate hover color (darken primary slightly)
    if (primary.startsWith('#')) {
      const hover = primary + 'cc'; // add opacity
      root.style.setProperty('--primary-hover', hover);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data.user);
          setTenant(res.data.tenant);
          if (res.data.tenant) {
            applyColors(res.data.tenant.primaryColor, res.data.tenant.secondaryColor);
          }
        } catch (error) {
          console.error('Failed to restore auth session:', error);
          logout();
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      const { accessToken, refreshToken, user: loggedUser, tenant: loggedTenant } = res.data;
      
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      
      setUser(loggedUser);
      setTenant(loggedTenant);

      if (loggedTenant) {
        applyColors(loggedTenant.primaryColor, loggedTenant.secondaryColor);
      }
    } catch (error: any) {
      setLoading(false);
      throw new Error(error.response?.data?.error || 'Credenciales incorrectas');
    }
    setLoading(false);
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    setTenant(null);
    
    // Reset colors to default
    const root = document.documentElement;
    root.style.setProperty('--primary-color', '#3b82f6');
    root.style.setProperty('--primary-hover', '#2563eb');
    root.style.setProperty('--secondary-color', '#10b981');
  };

  const updateTenantColors = (primary: string, secondary: string) => {
    if (tenant) {
      const updatedTenant = { ...tenant, primaryColor: primary, secondaryColor: secondary };
      setTenant(updatedTenant);
      applyColors(primary, secondary);
    }
  };

  const syncProfile = async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data.user);
      setTenant(res.data.tenant);
      if (res.data.tenant) {
        applyColors(res.data.tenant.primaryColor, res.data.tenant.secondaryColor);
      }
    } catch (e) {
      console.error('Error syncing profile info:', e);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      tenant,
      isAuthenticated: !!user,
      loading,
      login,
      logout,
      updateTenantColors,
      syncProfile
    }}>
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

import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

export interface CustomerUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  marketingOptIn?: boolean;
  isEmailVerified: boolean;
}

interface CustomerAuthContextType {
  customer: CustomerUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authModalOpen: boolean;
  authModalMode: 'login' | 'register' | 'otp' | 'forgot';
  pendingEmail: string;
  openAuthModal: (mode?: 'login' | 'register' | 'otp' | 'forgot', email?: string) => void;
  closeAuthModal: () => void;
  setAuthModalMode: (mode: 'login' | 'register' | 'otp' | 'forgot') => void;
  setPendingEmail: (email: string) => void;
  login: (credentials: { email: string; password: string }) => Promise<any>;
  register: (data: any) => Promise<any>;
  verifyOtp: (otp: string) => Promise<any>;
  resendOtp: () => Promise<any>;
  logout: () => Promise<void>;
  updateProfile: (data: any) => Promise<any>;
  refreshCustomer: () => Promise<void>;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined);

export const CustomerAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customer, setCustomer] = useState<CustomerUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | 'otp' | 'forgot'>('login');
  const [pendingEmail, setPendingEmail] = useState('');

  const refreshCustomer = async () => {
    const token = localStorage.getItem('customer_token');
    if (!token) {
      setCustomer(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await api.customerMe();
      if (res.success && res.customer) {
        setCustomer(res.customer);
      } else {
        setCustomer(null);
        localStorage.removeItem('customer_token');
      }
    } catch (err) {
      setCustomer(null);
      localStorage.removeItem('customer_token');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshCustomer();

    const handleUnauthorized = () => {
      setCustomer(null);
      localStorage.removeItem('customer_token');
    };

    window.addEventListener('argyr_customer_unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('argyr_customer_unauthorized', handleUnauthorized);
    };
  }, []);

  const openAuthModal = (mode: 'login' | 'register' | 'otp' | 'forgot' = 'login', email: string = '') => {
    setAuthModalMode(mode);
    if (email) setPendingEmail(email);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
  };

  const login = async (credentials: { email: string; password: string }) => {
    const res = await api.customerLogin(credentials);
    if (res.success && res.customer) {
      setCustomer(res.customer);
      closeAuthModal();
    }
    return res;
  };

  const register = async (data: any) => {
    const res = await api.customerRegister(data);
    if (res.success) {
      setPendingEmail(data.email);
      setAuthModalMode('otp');
    }
    return res;
  };

  const verifyOtp = async (otp: string) => {
    const res = await api.customerVerifyOtp({
      email: pendingEmail,
      otp
    });
    if (res.success && res.customer) {
      setCustomer(res.customer);
      closeAuthModal();
    }
    return res;
  };

  const resendOtp = async () => {
    return await api.customerResendOtp({ email: pendingEmail });
  };

  const logout = async () => {
    try {
      await api.customerLogout();
    } finally {
      setCustomer(null);
      localStorage.removeItem('customer_token');
    }
  };

  const updateProfile = async (data: any) => {
    const res = await api.updateCustomerProfile(data);
    if (res.success && res.customer) {
      setCustomer(prev => ({ ...prev, ...res.customer }));
    }
    return res;
  };

  return (
    <CustomerAuthContext.Provider
      value={{
        customer,
        isAuthenticated: Boolean(customer && customer.isEmailVerified),
        isLoading,
        authModalOpen,
        authModalMode,
        pendingEmail,
        openAuthModal,
        closeAuthModal,
        setAuthModalMode,
        setPendingEmail,
        login,
        register,
        verifyOtp,
        resendOtp,
        logout,
        updateProfile,
        refreshCustomer
      }}
    >
      {children}
    </CustomerAuthContext.Provider>
  );
};

export const useCustomerAuth = () => {
  const context = useContext(CustomerAuthContext);
  if (!context) {
    throw new Error('useCustomerAuth must be used within a CustomerAuthProvider');
  }
  return context;
};

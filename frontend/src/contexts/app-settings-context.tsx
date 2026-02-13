'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { apiClient } from '@/services/api';

interface AppSettings {
  id: string;
  sidebarLogo: string | null;
  sidebarText: string;
  primaryColor: string | null;
  secondaryColor: string | null;
  accentColor: string | null;
  sidebarColor: string | null;
  theme: string;
  customButtonEnabled: boolean;
  customButtonLabel: string;
  customButtonColor: string;
  customButtonUrl: string;
  version: number;
  updatedBy: string | null;
  updatedAt: string;
  createdAt: string;
}

interface AppSettingsContextType {
  settings: AppSettings | null;
  isLoading: boolean;
  refreshSettings: () => Promise<void>;
}

const AppSettingsContext = createContext<AppSettingsContextType | undefined>(undefined);

export function AppSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadSettings = async () => {
    try {
      // Tentar carregar configurações
      const data = await apiClient.appSettings.get() as AppSettings;

      if (!data) {
        throw new Error('No settings data received');
      }

      setSettings(data);

      // Aplicar cores customizadas ao documento
      applyCustomColors(data);

      // Aplicar tema
      applyTheme(data.theme);
    } catch (error) {
      // Se falhar (ex: utilizador não autenticado), usar valores padrão
      console.warn('Failed to load app settings, using defaults:', error);
      // Em caso de erro, usar valores padrão
      const defaultSettings: AppSettings = {
        id: 'default',
        sidebarLogo: null,
        sidebarText: 'Grupo RAF',
        primaryColor: null,
        secondaryColor: null,
        accentColor: null,
        sidebarColor: null,
        theme: 'light',
        customButtonEnabled: true,
        customButtonLabel: 'CRM MyCredit',
        customButtonColor: '#22c55e',
        customButtonUrl: 'https://mycredit.pt',
        version: 1,
        updatedBy: null,
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      setSettings(defaultSettings);
      applyCustomColors(defaultSettings);
      applyTheme(defaultSettings.theme);
    } finally {
      setIsLoading(false);
    }
  };

  const applyCustomColors = (data: AppSettings) => {
    const root = document.documentElement;

    if (data.primaryColor) {
      root.style.setProperty('--primary-color', data.primaryColor);
    } else {
      root.style.removeProperty('--primary-color');
    }

    if (data.secondaryColor) {
      root.style.setProperty('--secondary-color', data.secondaryColor);
    } else {
      root.style.removeProperty('--secondary-color');
    }

    if (data.accentColor) {
      root.style.setProperty('--accent-color', data.accentColor);
    } else {
      root.style.removeProperty('--accent-color');
    }

    // Aplicar cor da sidebar
    if (data.sidebarColor) {
      root.style.setProperty('--sidebar-bg-start', data.sidebarColor);
      // Criar uma versão mais escura para o gradiente
      const rgb = hexToRgb(data.sidebarColor);
      if (rgb) {
        const darkerColor = `rgb(${Math.max(0, rgb.r - 40)}, ${Math.max(0, rgb.g - 40)}, ${Math.max(0, rgb.b - 40)})`;
        root.style.setProperty('--sidebar-bg-end', darkerColor);
      }
    } else {
      root.style.removeProperty('--sidebar-bg-start');
      root.style.removeProperty('--sidebar-bg-end');
    }
  };

  // Helper para converter hex para RGB
  const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  };

  const applyTheme = (theme: string) => {
    const root = document.documentElement;

    // Remover classes de tema existentes
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      // Usar tema do sistema
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.add(prefersDark ? 'dark' : 'light');
    } else {
      // Usar tema específico
      root.classList.add(theme);
    }
  };

  useEffect(() => {
    loadSettings();

    // Listener para mudanças no tema do sistema
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (settings?.theme === 'system') {
        applyTheme('system');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const refreshSettings = async () => {
    await loadSettings();
  };

  return (
    <AppSettingsContext.Provider value={{ settings, isLoading, refreshSettings }}>
      {children}
    </AppSettingsContext.Provider>
  );
}

export function useAppSettings() {
  const context = useContext(AppSettingsContext);
  if (context === undefined) {
    throw new Error('useAppSettings must be used within an AppSettingsProvider');
  }
  return context;
}

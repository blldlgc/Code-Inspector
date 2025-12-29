import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { accessibilityApi } from '@/lib/accessibilityApi';
import { authService } from '@/lib/auth';

export type FontSize = 'small' | 'medium' | 'large' | 'xlarge';
export type FontFamily = 'default' | 'sans-serif' | 'serif' | 'monospace';
export type ColorBlindnessTheme = 'none' | 'deuteranopia' | 'protanopia' | 'tritanopia';

export interface AccessibilitySettings {
  fontSize: FontSize;
  fontFamily: FontFamily;
  highContrast: boolean;
  colorBlindnessTheme: ColorBlindnessTheme;
  voiceReadingEnabled: boolean;
  voiceReadingSpeed: number; // 0.5 to 2.0
}

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSettings: (newSettings: Partial<AccessibilitySettings>) => Promise<void>;
  isLoading: boolean;
}

const defaultSettings: AccessibilitySettings = {
  fontSize: 'medium',
  fontFamily: 'default',
  highContrast: false,
  colorBlindnessTheme: 'none',
  voiceReadingEnabled: false,
  voiceReadingSpeed: 1.0,
};

const AccessibilityContext = createContext<AccessibilityContextType | null>(null);

export const AccessibilityProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<AccessibilitySettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  // Backend'den ayarları yükle
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        
        // Token kontrolü - token yoksa veya geçersizse varsayılan ayarları kullan
        const token = authService.getToken();
        if (!token || authService.isTokenExpired()) {
          console.log('Token yok veya geçersiz - varsayılan erişilebilirlik ayarları kullanılıyor');
          applySettings(defaultSettings);
          setIsLoading(false);
          return;
        }
        
        const loadedSettings = await accessibilityApi.getSettings();
        setSettings(loadedSettings);
        applySettings(loadedSettings);
      } catch (error: any) {
        console.error('Erişilebilirlik ayarları yüklenirken hata:', error);
        
        // Token yoksa veya yetkilendirme hatası durumunda varsayılan ayarları kullan
        if (!authService.getToken() || error.response?.status === 403 || error.response?.status === 401 || error.message?.includes('Token')) {
          console.log('Yetkilendirme hatası veya token yok - varsayılan ayarlar kullanılıyor');
        }
        
        // Hata durumunda varsayılan ayarları kullan
        applySettings(defaultSettings);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Ayarları CSS'e uygula
  const applySettings = (newSettings: AccessibilitySettings) => {
    const root = document.documentElement;

    // Font boyutu
    const fontSizeMap = {
      small: '0.875rem',
      medium: '1rem',
      large: '1.25rem',
      xlarge: '1.5rem',
    };
    root.style.setProperty('--accessibility-font-size', fontSizeMap[newSettings.fontSize]);

    // Font ailesi
    const fontFamilyMap = {
      default: 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif',
      'sans-serif': 'system-ui, -apple-system, sans-serif',
      serif: 'Georgia, serif',
      monospace: 'Monaco, "Courier New", monospace',
    };

    const resolvedFontFamily = fontFamilyMap[newSettings.fontFamily];

    // CSS değişkeni üzerinden global font ailesini ayarla
    root.style.setProperty('--accessibility-font-family', resolvedFontFamily);

    // Ek olarak html ve body için de doğrudan font-family uygula
    root.style.fontFamily = resolvedFontFamily;
    if (document.body) {
      document.body.style.fontFamily = resolvedFontFamily;
    }

    // Yüksek kontrast
    if (newSettings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Renk körlüğü teması
    root.classList.remove('colorblind-deuteranopia', 'colorblind-protanopia', 'colorblind-tritanopia');
    if (newSettings.colorBlindnessTheme !== 'none') {
      root.classList.add(`colorblind-${newSettings.colorBlindnessTheme}`);
    }
  };

  // Ayarları güncelle
  const updateSettings = async (newSettings: Partial<AccessibilitySettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    applySettings(updatedSettings);

    // Token kontrolü - token yoksa veya geçersizse sadece local state'i güncelle
    const token = authService.getToken();
    if (!token || authService.isTokenExpired()) {
      console.log('Token yok veya geçersiz - ayarlar sadece local olarak kaydedildi');
      return;
    }

    // Backend'e kaydet - sadece değişen alanları gönder
    try {
      await accessibilityApi.updateSettings(newSettings);
    } catch (error: any) {
      console.error('Erişilebilirlik ayarları kaydedilirken hata:', error);
      console.error('Error response data:', error.response?.data);
      
      // Token hatası değilse eski ayarlara geri dön
      if (!error.message?.includes('Token')) {
        setSettings(settings);
        applySettings(settings);
      }
    }
  };

  // Ayarlar değiştiğinde CSS'i güncelle
  useEffect(() => {
    applySettings(settings);
  }, [settings]);

  return (
    <AccessibilityContext.Provider value={{ settings, updateSettings, isLoading }}>
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};



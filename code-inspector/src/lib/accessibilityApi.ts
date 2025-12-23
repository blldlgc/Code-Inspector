import axios from 'axios';
import { authService } from './auth';
import { AccessibilitySettings } from '@/context/AccessibilityContext';

const BACKEND_BASE_URL: string = (import.meta as any).env?.VITE_BACKEND_URL || 'http://localhost:8080';

export const accessibilityApi = {
  getSettings: async (): Promise<AccessibilitySettings> => {
    authService.checkTokenAndLogout();
    try {
      const response = await axios.get(`${BACKEND_BASE_URL}/api/accessibility/settings`, {
        headers: {
          Authorization: `Bearer ${authService.getToken()}`,
        },
      });
      return response.data;
    } catch (error: any) {
      console.error('Accessibility API - GET Error response:', error.response?.data);
      console.error('Accessibility API - GET Error status:', error.response?.status);
      throw error;
    }
  },

  updateSettings: async (settings: Partial<AccessibilitySettings>): Promise<AccessibilitySettings> => {
    authService.checkTokenAndLogout();
    // Backend'in beklediği formata dönüştür - sadece tanımlı alanları gönder
    const requestData: Record<string, any> = {};
    if (settings.fontSize !== undefined) requestData.fontSize = settings.fontSize;
    if (settings.fontFamily !== undefined) requestData.fontFamily = settings.fontFamily;
    if (settings.highContrast !== undefined) requestData.highContrast = settings.highContrast;
    if (settings.colorBlindnessTheme !== undefined) requestData.colorBlindnessTheme = settings.colorBlindnessTheme;
    if (settings.voiceReadingEnabled !== undefined) requestData.voiceReadingEnabled = settings.voiceReadingEnabled;
    if (settings.voiceReadingSpeed !== undefined) requestData.voiceReadingSpeed = settings.voiceReadingSpeed;
    
    console.log('Accessibility API - Sending request:', requestData);
    try {
      const response = await axios.put(
        `${BACKEND_BASE_URL}/api/accessibility/settings`,
        requestData,
        {
          headers: {
            Authorization: `Bearer ${authService.getToken()}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Accessibility API - Error response:', error.response?.data);
      console.error('Accessibility API - Error status:', error.response?.status);
      console.error('Accessibility API - Request data:', requestData);
      throw error;
    }
  },
};



import { useEffect } from 'react';

interface KeyboardShortcutsOptions {
  onAccessibilitySettings?: () => void;
  onVoicePlay?: () => void;
  onVoiceRepeat?: () => void;
}

export const useKeyboardShortcuts = (options: KeyboardShortcutsOptions = {}) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Alt + S: Erişilebilirlik ayarlarını aç
      if (event.altKey && event.key === 's') {
        event.preventDefault();
        options.onAccessibilitySettings?.();
        return;
      }

      // Alt + V: Sesli okumayı başlat/durdur
      if (event.altKey && event.key === 'v') {
        event.preventDefault();
        options.onVoicePlay?.();
        return;
      }

      // Alt + R: Sesli okumayı tekrarla
      if (event.altKey && event.key === 'r') {
        event.preventDefault();
        options.onVoiceRepeat?.();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [options]);
};



// Log görüntüleme ve temizleme utility'leri

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  source?: string;
  [key: string]: any;
}

export const logger = {
  // Tüm logları getir
  getAllLogs(): LogEntry[] {
    try {
      return JSON.parse(localStorage.getItem('app_logs') || '[]');
    } catch (e) {
      console.error('Log okuma hatası:', e);
      return [];
    }
  },

  // Logları console'a yazdır
  printLogs(): void {
    const logs = this.getAllLogs();
    console.group('📋 Application Logs');
    logs.forEach((log, index) => {
      const style = log.level === 'error' ? 'color: red' : log.level === 'warn' ? 'color: orange' : 'color: blue';
      console.log(`%c[${log.timestamp}] ${log.level.toUpperCase()}: ${log.message}`, style, log);
    });
    console.groupEnd();
  },

  // Logları temizle
  clearLogs(): void {
    localStorage.removeItem('app_logs');
    console.log('Loglar temizlendi');
  },

  // Son N log'u getir
  getRecentLogs(count: number = 10): LogEntry[] {
    const logs = this.getAllLogs();
    return logs.slice(-count);
  },

  // Hata loglarını getir
  getErrorLogs(): LogEntry[] {
    return this.getAllLogs().filter(log => log.level === 'error');
  }
};

// Global olarak erişilebilir yap
if (typeof window !== 'undefined') {
  (window as any).appLogger = logger;
  console.log('📋 Log görüntülemek için: window.appLogger.printLogs()');
  console.log('🗑️ Logları temizlemek için: window.appLogger.clearLogs()');
}


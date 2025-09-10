import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

const logs = [
  {
    id: 1,
    type: "warning",
    message: "Başarısız giriş denemesi - IP: 192.168.1.100",
    timestamp: "2024-03-09T15:30:00Z",
  },
  {
    id: 2,
    type: "info",
    message: "Yeni kullanıcı kaydı: user@example.com",
    timestamp: "2024-03-09T15:25:00Z",
  },
  {
    id: 3,
    type: "error",
    message: "Yetkisiz API erişim denemesi",
    timestamp: "2024-03-09T15:20:00Z",
  },
  {
    id: 4,
    type: "success",
    message: "Sistem yedeklemesi başarıyla tamamlandı",
    timestamp: "2024-03-09T15:15:00Z",
  },
];

export function SecurityLogs() {
  return (
    <ScrollArea className="h-[400px] rounded-md border p-4">
      <div className="space-y-4">
        {logs.map((log) => (
          <div
            key={log.id}
            className="flex items-center justify-between border-b pb-2 last:border-0"
          >
            <div className="space-y-1">
              <p className="text-sm">{log.message}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(log.timestamp).toLocaleString("tr-TR")}
              </p>
            </div>
            <Badge
              variant={
                log.type === "error"
                  ? "destructive"
                  : log.type === "warning"
                  ? "warning"
                  : log.type === "success"
                  ? "success"
                  : "secondary"
              }
            >
              {log.type}
            </Badge>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}




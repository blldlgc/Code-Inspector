import { Progress } from "@/components/ui/progress";

export function SystemHealth() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">CPU Kullanımı</div>
          <div className="text-sm text-muted-foreground">45%</div>
        </div>
        <Progress value={45} />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">Bellek Kullanımı</div>
          <div className="text-sm text-muted-foreground">62%</div>
        </div>
        <Progress value={62} />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">Disk Kullanımı</div>
          <div className="text-sm text-muted-foreground">28%</div>
        </div>
        <Progress value={28} />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">API Yanıt Süresi</div>
          <div className="text-sm text-muted-foreground">120ms</div>
        </div>
        <Progress value={20} />
      </div>
    </div>
  );
}




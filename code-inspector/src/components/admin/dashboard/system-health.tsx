import { Progress } from "@/components/ui/progress";

export function SystemHealth() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">CPU Usage</div>
          <div className="text-sm text-muted-foreground">45%</div>
        </div>
        <Progress value={45} />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">Memory Usage</div>
          <div className="text-sm text-muted-foreground">62%</div>
        </div>
        <Progress value={62} />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">Disk Usage</div>
          <div className="text-sm text-muted-foreground">28%</div>
        </div>
        <Progress value={28} />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">API Response Time</div>
          <div className="text-sm text-muted-foreground">120ms</div>
        </div>
        <Progress value={20} />
      </div>
    </div>
  );
}




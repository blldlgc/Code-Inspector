import { useEffect, useState } from "react";
import axios from "axios";
import { Progress } from "@/components/ui/progress";

export function SystemHealth() {
  // Yorum: Backend'den sistem sağlık metriklerini çeker
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [health, setHealth] = useState<{
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    apiResponseTime: number;
  } | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchHealth = async () => {
      try {
        setError(null);
        const { data } = await axios.get("/api/admin/system-health");
        if (!mounted) return;
        setHealth({
          cpuUsage: Math.round(data.cpuUsage ?? 0),
          memoryUsage: Math.round(data.memoryUsage ?? 0),
          diskUsage: Math.round(data.diskUsage ?? 0),
          apiResponseTime: data.apiResponseTime ?? 0,
        });
      } catch (e) {
        if (!mounted) return;
        setError("Failed to load system health");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    // İlk yükleme
    setLoading(true);
    fetchHealth();

    // Yorum: 5 saniyede bir güncelle
    const intervalId = window.setInterval(fetchHealth, 5000);
    return () => { 
      mounted = false; 
      window.clearInterval(intervalId);
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="text-sm text-muted-foreground">Loading system health...</div>
      </div>
    );
  }

  if (error || !health) {
    return (
      <div className="space-y-4">
        <div className="text-sm text-red-500">{error ?? "No system health data"}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">CPU Usage</div>
          <div className="text-sm text-muted-foreground">{health.cpuUsage}%</div>
        </div>
        <Progress value={health.cpuUsage} />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">Memory Usage</div>
          <div className="text-sm text-muted-foreground">{health.memoryUsage}%</div>
        </div>
        <Progress value={health.memoryUsage} />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">Disk Usage</div>
          <div className="text-sm text-muted-foreground">{health.diskUsage}%</div>
        </div>
        <Progress value={health.diskUsage} />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">API Response Time</div>
          <div className="text-sm text-muted-foreground">{health.apiResponseTime}ms</div>
        </div>
        <Progress value={Math.min(100, Math.max(0, (health.apiResponseTime / 1000) * 100))} />
      </div>
    </div>
  );
}




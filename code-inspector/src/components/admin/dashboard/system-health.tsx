import { useEffect, useState } from "react";
import axios from "axios";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Cpu, HardDrive, MemoryStick, Zap, AlertTriangle, CheckCircle } from "lucide-react";

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
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 bg-muted rounded animate-pulse" />
              <div className="h-4 w-12 bg-muted rounded animate-pulse" />
            </div>
            <div className="h-2 w-full bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (error || !health) {
    return (
      <Card className="border-destructive/20 bg-destructive/5">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm">{error ?? "No system health data available"}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sistem sağlık durumunu belirle
  const getHealthStatus = (value: number, type: 'cpu' | 'memory' | 'disk' | 'api') => {
    if (type === 'api') {
      if (value < 100) return { status: 'excellent', color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800' };
      if (value < 500) return { status: 'good', color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800' };
      if (value < 1000) return { status: 'warning', color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800' };
      return { status: 'critical', color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800' };
    }
    
    if (value < 50) return { status: 'excellent', color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800' };
    if (value < 75) return { status: 'good', color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800' };
    if (value < 90) return { status: 'warning', color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800' };
    return { status: 'critical', color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800' };
  };

  const cpuStatus = getHealthStatus(health.cpuUsage, 'cpu');
  const memoryStatus = getHealthStatus(health.memoryUsage, 'memory');
  const diskStatus = getHealthStatus(health.diskUsage, 'disk');
  const apiStatus = getHealthStatus(health.apiResponseTime, 'api');

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* CPU Usage */}
      <Card className="relative overflow-hidden border-l-4 border-l-slate-300 dark:border-l-slate-600">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">CPU Usage</CardTitle>
          <div className="p-2 rounded-full bg-slate-100 dark:bg-slate-800">
            <Cpu className="h-4 w-4 text-slate-600 dark:text-slate-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-2">
            <div className="text-2xl font-bold">{health.cpuUsage}%</div>
            <Badge variant="secondary" className={`text-xs ${cpuStatus.bg} ${cpuStatus.color}`}>
              {cpuStatus.status === 'excellent' && <CheckCircle className="h-3 w-3 mr-1" />}
              {cpuStatus.status === 'critical' && <AlertTriangle className="h-3 w-3 mr-1" />}
              {cpuStatus.status}
            </Badge>
          </div>
          <Progress value={health.cpuUsage} className="h-2" />
        </CardContent>
      </Card>

      {/* Memory Usage */}
      <Card className="relative overflow-hidden border-l-4 border-l-slate-300 dark:border-l-slate-600">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Memory Usage</CardTitle>
          <div className="p-2 rounded-full bg-slate-100 dark:bg-slate-800">
            <MemoryStick className="h-4 w-4 text-slate-600 dark:text-slate-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-2">
            <div className="text-2xl font-bold">{health.memoryUsage}%</div>
            <Badge variant="secondary" className={`text-xs ${memoryStatus.bg} ${memoryStatus.color}`}>
              {memoryStatus.status === 'excellent' && <CheckCircle className="h-3 w-3 mr-1" />}
              {memoryStatus.status === 'critical' && <AlertTriangle className="h-3 w-3 mr-1" />}
              {memoryStatus.status}
            </Badge>
          </div>
          <Progress value={health.memoryUsage} className="h-2" />
        </CardContent>
      </Card>

      {/* Disk Usage */}
      <Card className="relative overflow-hidden border-l-4 border-l-slate-300 dark:border-l-slate-600">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Disk Usage</CardTitle>
          <div className="p-2 rounded-full bg-slate-100 dark:bg-slate-800">
            <HardDrive className="h-4 w-4 text-slate-600 dark:text-slate-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-2">
            <div className="text-2xl font-bold">{health.diskUsage}%</div>
            <Badge variant="secondary" className={`text-xs ${diskStatus.bg} ${diskStatus.color}`}>
              {diskStatus.status === 'excellent' && <CheckCircle className="h-3 w-3 mr-1" />}
              {diskStatus.status === 'critical' && <AlertTriangle className="h-3 w-3 mr-1" />}
              {diskStatus.status}
            </Badge>
          </div>
          <Progress value={health.diskUsage} className="h-2" />
        </CardContent>
      </Card>

      {/* API Response Time */}
      <Card className="relative overflow-hidden border-l-4 border-l-slate-300 dark:border-l-slate-600">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">API Response Time</CardTitle>
          <div className="p-2 rounded-full bg-slate-100 dark:bg-slate-800">
            <Zap className="h-4 w-4 text-slate-600 dark:text-slate-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-2">
            <div className="text-2xl font-bold">{health.apiResponseTime}ms</div>
            <Badge variant="secondary" className={`text-xs ${apiStatus.bg} ${apiStatus.color}`}>
              {apiStatus.status === 'excellent' && <CheckCircle className="h-3 w-3 mr-1" />}
              {apiStatus.status === 'critical' && <AlertTriangle className="h-3 w-3 mr-1" />}
              {apiStatus.status}
            </Badge>
          </div>
          <Progress value={Math.min(100, Math.max(0, (health.apiResponseTime / 1000) * 100))} className="h-2" />
        </CardContent>
      </Card>
    </div>
  );
}




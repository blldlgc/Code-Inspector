import { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, UserX, Shield, TrendingUp, TrendingDown, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { FadeIn } from "@/components/ui/fade-in";

export function UserStats() {
  // Yorum: Backend'den istatistikleri çeker ve gösterir
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    adminCount: number;
    newUsersLast24h: number;
  } | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchStats = async () => {
      try {
        setError(null);
        const { data } = await axios.get("/api/admin/stats");
        if (!mounted) return;
        setStats({
          totalUsers: data.totalUsers ?? 0,
          activeUsers: data.activeUsers ?? 0,
          inactiveUsers: data.inactiveUsers ?? 0,
          adminCount: data.adminCount ?? 0,
          newUsersLast24h: data.newUsersLast24h ?? 0,
        });
      } catch (e) {
        if (!mounted) return;
        setError("Failed to load statistics");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    // İlk yükleme
    setLoading(true);
    fetchStats();

    // Yorum: 30 saniyede bir güncelle
    const intervalId = window.setInterval(fetchStats, 30000);
    return () => {
      mounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  if (loading) {
    return (
      <>
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-muted/20 to-muted/10 animate-pulse" />
            <CardHeader className="pb-2">
              <div className="h-4 w-24 bg-muted rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted rounded animate-pulse mb-2" />
              <div className="h-3 w-32 bg-muted rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </>
    );
  }

  if (error || !stats) {
    return (
      <>
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-destructive/20 bg-destructive/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-destructive">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-destructive">{error ?? "No data available"}</div>
            </CardContent>
          </Card>
        ))}
      </>
    );
  }

  const activeRate = stats.totalUsers > 0 ? Math.round((stats.activeUsers * 100) / stats.totalUsers) : 0;
  const inactiveUsers = stats.totalUsers - stats.activeUsers; // Son 7 günde giriş yapmayan kullanıcılar
  const inactiveRate = stats.totalUsers > 0 ? Math.round((inactiveUsers * 100) / stats.totalUsers) : 0;

  return (
    <>
      {/* Total Users Card */}
      <FadeIn delay={0}>
        <Card className="relative overflow-hidden border-l-4 border-l-slate-300 dark:border-l-slate-600 hover:shadow-lg transition-all duration-300 group hover:scale-105">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-slate-100/50 to-slate-200/30 dark:from-slate-800/30 dark:to-slate-700/20 rounded-bl-full" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
            <div className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-slate-200 dark:group-hover:bg-slate-700 transition-colors">
              <Users className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground mb-1">{stats.totalUsers}</div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                <TrendingUp className="h-3 w-3 mr-1" />
                +{stats.newUsersLast24h}
              </Badge>
              <p className="text-xs text-muted-foreground">new users (24h)</p>
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      {/* Active Users Card */}
      <FadeIn delay={100}>
        <Card className="relative overflow-hidden border-l-4 border-l-slate-300 dark:border-l-slate-600 hover:shadow-lg transition-all duration-300 group hover:scale-105">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-slate-100/50 to-slate-200/30 dark:from-slate-800/30 dark:to-slate-700/20 rounded-bl-full" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Users</CardTitle>
            <div className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-slate-200 dark:group-hover:bg-slate-700 transition-colors">
              <UserCheck className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground mb-1">{stats.activeUsers}</div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                <Activity className="h-3 w-3 mr-1" />
                {activeRate}%
              </Badge>
              <p className="text-xs text-muted-foreground">logged in (last 7 days)</p>
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      {/* Inactive Users Card */}
      <FadeIn delay={200}>
        <Card className="relative overflow-hidden border-l-4 border-l-slate-300 dark:border-l-slate-600 hover:shadow-lg transition-all duration-300 group hover:scale-105">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-slate-100/50 to-slate-200/30 dark:from-slate-800/30 dark:to-slate-700/20 rounded-bl-full" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Inactive Users</CardTitle>
            <div className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-slate-200 dark:group-hover:bg-slate-700 transition-colors">
              <UserX className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground mb-1">{inactiveUsers}</div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                <TrendingDown className="h-3 w-3 mr-1" />
                {inactiveRate}%
              </Badge>
              <p className="text-xs text-muted-foreground">not logged in (7 days)</p>
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      {/* Admin Count Card */}
      <FadeIn delay={300}>
        <Card className="relative overflow-hidden border-l-4 border-l-slate-300 dark:border-l-slate-600 hover:shadow-lg transition-all duration-300 group hover:scale-105">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-slate-100/50 to-slate-200/30 dark:from-slate-800/30 dark:to-slate-700/20 rounded-bl-full" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Admin Count</CardTitle>
            <div className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-slate-200 dark:group-hover:bg-slate-700 transition-colors">
              <Shield className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground mb-1">{stats.adminCount}</div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                <Shield className="h-3 w-3 mr-1" />
                Admins
              </Badge>
              <p className="text-xs text-muted-foreground">total administrators</p>
            </div>
          </CardContent>
        </Card>
      </FadeIn>
    </>
  );
}




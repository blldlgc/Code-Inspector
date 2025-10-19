import { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, UserX, Shield } from "lucide-react";

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
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Users</CardTitle></CardHeader><CardContent><div className="text-sm text-muted-foreground">Loading...</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Active Users</CardTitle></CardHeader><CardContent><div className="text-sm text-muted-foreground">Loading...</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Inactive Users</CardTitle></CardHeader><CardContent><div className="text-sm text-muted-foreground">Loading...</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Admin Count</CardTitle></CardHeader><CardContent><div className="text-sm text-muted-foreground">Loading...</div></CardContent></Card>
      </>
    );
  }

  if (error || !stats) {
    return (
      <>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Users</CardTitle></CardHeader><CardContent><div className="text-sm text-red-500">{error ?? "No data"}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Active Users</CardTitle></CardHeader><CardContent><div className="text-sm text-red-500">{error ?? "No data"}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Inactive Users</CardTitle></CardHeader><CardContent><div className="text-sm text-red-500">{error ?? "No data"}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Admin Count</CardTitle></CardHeader><CardContent><div className="text-sm text-red-500">{error ?? "No data"}</div></CardContent></Card>
      </>
    );
  }

  const activeRate = stats.totalUsers > 0 ? Math.round((stats.activeUsers * 100) / stats.totalUsers) : 0;
  const inactiveRate = stats.totalUsers > 0 ? Math.round((stats.inactiveUsers * 100) / stats.totalUsers) : 0;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalUsers}</div>
          <p className="text-xs text-muted-foreground">
            +{stats.newUsersLast24h} new users (last 24 hours)
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Users</CardTitle>
          <UserCheck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.activeUsers}</div>
          <p className="text-xs text-muted-foreground">
            {activeRate}% active usage rate
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Inactive Users</CardTitle>
          <UserX className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.inactiveUsers}</div>
          <p className="text-xs text-muted-foreground">
            {inactiveRate}% inactive usage rate
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Admin Count</CardTitle>
          <Shield className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.adminCount}</div>
          <p className="text-xs text-muted-foreground">
            Total administrators
          </p>
        </CardContent>
      </Card>
    </>
  );
}




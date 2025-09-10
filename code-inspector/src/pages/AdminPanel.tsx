import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageLayout } from "@/components/PageLayout";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/context/AuthContext';
import { Navigate } from 'react-router-dom';
import {
  BarChart,
  Users,
  Settings,
  Shield,
} from "lucide-react";
import { columns } from "@/components/admin/users/columns";
import { UserStats } from "@/components/admin/dashboard/user-stats";
import { SystemHealth } from "@/components/admin/dashboard/system-health";
import { SecurityLogs } from "@/components/admin/security/security-logs";
import { SystemSettings } from "@/components/admin/settings/system-settings";
import { userService } from "@/services/userService";
import { User } from "@/types/user";

export default function AdminPanel() {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await userService.getAllUsers();
        console.log('Fetched users in AdminPanel:', data);
        setUsers(data);
      } catch (error) {
        console.error('Error fetching users:', error);
        setError('Kullanıcılar yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Admin rolü kontrolü
  if (currentUser?.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  return (
    <PageLayout
      title="Admin Panel"
      description="Sistem yönetimi ve kullanıcı kontrolü"
    >
      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Kullanıcılar
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Güvenlik
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Ayarlar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <UserStats />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Sistem Durumu</CardTitle>
              </CardHeader>
              <CardContent>
                <SystemHealth />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Kullanıcı Yönetimi</CardTitle>
                <Button>Yeni Kullanıcı</Button>
              </div>
            </CardHeader>
            <CardContent>
              {error ? (
                <div className="text-red-500 p-4">
                  {error}
                  <Button 
                    variant="outline" 
                    className="ml-4"
                    onClick={() => {
                      setLoading(true);
                      setError(null);
                      userService.getAllUsers()
                        .then(data => setUsers(data))
                        .catch(err => {
                          console.error('Error retrying fetch:', err);
                          setError('Kullanıcılar yüklenirken bir hata oluştu.');
                        })
                        .finally(() => setLoading(false));
                    }}
                  >
                    Tekrar Dene
                  </Button>
                </div>
              ) : (
                <DataTable
                  columns={columns}
                  data={users}
                  loading={loading}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Güvenlik Logları</CardTitle>
            </CardHeader>
            <CardContent>
              <SecurityLogs />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Sistem Ayarları</CardTitle>
            </CardHeader>
            <CardContent>
              <SystemSettings />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
}
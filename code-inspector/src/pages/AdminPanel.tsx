import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageLayout } from "@/components/PageLayout";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
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
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    role: "USER" as const,
    enabled: true,
  });

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
  if (currentUser?.role !== 'ROLE_ADMIN') {
    return <Navigate to="/" replace />;
  }

  return (
    <PageLayout
      title="Admin Panel"
      description="System management and user control"
    >
      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <UserStats />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>System Status</CardTitle>
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
                <CardTitle>User Management</CardTitle>
                <Dialog open={open} onOpenChange={setOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => setOpen(true)}>New User</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>New User</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="username" className="text-right">Username</Label>
                        <Input id="username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="col-span-3" />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">Email</Label>
                        <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="col-span-3" />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="password" className="text-right">Password</Label>
                        <Input id="password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="col-span-3" />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Role</Label>
                        <Select value={form.role} onValueChange={(value: string) => setForm({ ...form, role: value as typeof form.role })}>
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USER">USER</SelectItem>
                            <SelectItem value="ADMIN">ADMIN</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Active</Label>
                        <div className="col-span-3 flex items-center space-x-2">
                          <Switch 
                            checked={form.enabled} 
                            onCheckedChange={(checked: boolean) => setForm({ ...form, enabled: checked })}
                          />
                          <span className="text-sm text-muted-foreground">
                            {form.enabled ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        disabled={saving || !form.username || !form.email || form.password.length < 6}
                        onClick={async () => {
                          try {
                            setSaving(true);
                            await userService.createUser({
                              username: form.username,
                              email: form.email,
                              password: form.password,
                              role: form.role as any,
                              enabled: form.enabled,
                            } as any);
                            setOpen(false);
                            setForm({ username: "", email: "", password: "", role: "USER", enabled: true });
                            // Listeyi yenile
                            setLoading(true);
                            setError(null);
                            const data = await userService.getAllUsers();
                            setUsers(data);
                          } catch {
                            alert("Failed to create user. Please check the information.");
                          } finally {
                            setLoading(false);
                            setSaving(false);
                          }
                        }}
                      >
                        Save
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
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
                          setError('Failed to load users. Please try again.');
                        })
                        .finally(() => setLoading(false));
                    }}
                  >
                    Try Again
                  </Button>
                </div>
              ) : (
                <DataTable columns={columns} data={users} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <SecurityLogs />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
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
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
  UsersRound,
} from "lucide-react";
import { FadeIn } from "@/components/ui/fade-in";
import { columns } from "@/components/admin/users/columns";
import { UserStats } from "@/components/admin/dashboard/user-stats";
import { SystemHealth } from "@/components/admin/dashboard/system-health";
import { SecurityLogs } from "@/components/admin/security/security-logs";
import { SystemSettings } from "@/components/admin/settings/system-settings";
import { TeamsList } from "@/components/admin/teams/TeamsList";
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
          <TabsTrigger value="teams" className="flex items-center gap-2">
            <UsersRound className="h-4 w-4" />
            Teams
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

        <TabsContent value="dashboard" className="space-y-6">
          {/* Welcome Section */}
          <FadeIn delay={0}>
            <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/30 rounded-lg p-6 border hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">Welcome to Admin Dashboard</h2>
                  <p className="text-muted-foreground">Monitor your system performance and manage users efficiently</p>
                </div>
                <div className="hidden md:block">
                  <div className="w-16 h-16 bg-gradient-to-br from-slate-600 to-slate-700 dark:from-slate-500 dark:to-slate-600 rounded-full flex items-center justify-center hover:scale-110 transition-transform duration-300">
                    <BarChart className="h-8 w-8 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>

          {/* User Statistics */}
          <FadeIn delay={200}>
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Statistics
              </h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <UserStats />
              </div>
            </div>
          </FadeIn>

          {/* System Health */}
          <FadeIn delay={400}>
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5" />
                System Health
              </h3>
              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-slate-500 rounded-full animate-pulse" />
                    Real-time System Metrics
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">Live monitoring of system performance and resource usage</p>
                </CardHeader>
                <CardContent>
                  <SystemHealth />
                </CardContent>
              </Card>
            </div>
          </FadeIn>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          {/* Users Overview */}
          <FadeIn delay={0}>
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/50 dark:to-blue-800/30 rounded-lg p-6 border hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">User Management</h2>
                  <p className="text-muted-foreground">Manage system users and their permissions</p>
                </div>
                <div className="hidden md:block">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 rounded-full flex items-center justify-center hover:scale-110 transition-transform duration-300">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={200}>
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                    User List
                  </CardTitle>
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
                <DataTable 
                  columns={columns} 
                  data={users} 
                  meta={{
                    refreshData: async () => {
                      try {
                        setLoading(true);
                        setError(null);
                        const data = await userService.getAllUsers();
                        setUsers(data);
                      } catch (error) {
                        console.error('Error refreshing users:', error);
                        setError('Kullanıcılar yüklenirken bir hata oluştu.');
                      } finally {
                        setLoading(false);
                      }
                    }
                  }}
                />
              )}
            </CardContent>
            </Card>
          </FadeIn>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          {/* Security Overview */}
          <FadeIn delay={0}>
            <div className="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/50 dark:to-red-800/30 rounded-lg p-6 border hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">Security Center</h2>
                  <p className="text-muted-foreground">Monitor security events and system threats</p>
                </div>
                <div className="hidden md:block">
                  <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-red-700 dark:from-red-500 dark:to-red-600 rounded-full flex items-center justify-center hover:scale-110 transition-transform duration-300">
                    <Shield className="h-8 w-8 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={200}>
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  Security Logs
                </CardTitle>
                <p className="text-sm text-muted-foreground">Real-time security monitoring and threat detection</p>
              </CardHeader>
              <CardContent>
                <SecurityLogs />
              </CardContent>
            </Card>
          </FadeIn>
        </TabsContent>

        <TabsContent value="teams" className="space-y-6">
          {/* Teams Overview */}
          <FadeIn delay={0}>
            <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/50 dark:to-green-800/30 rounded-lg p-6 border hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">Team Management</h2>
                  <p className="text-muted-foreground">Organize users into teams and manage permissions</p>
                </div>
                <div className="hidden md:block">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-green-700 dark:from-green-500 dark:to-green-600 rounded-full flex items-center justify-center hover:scale-110 transition-transform duration-300">
                    <UsersRound className="h-8 w-8 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={200}>
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Teams List
                </CardTitle>
                <p className="text-sm text-muted-foreground">Manage team structures and member assignments</p>
              </CardHeader>
              <CardContent>
                <TeamsList />
              </CardContent>
            </Card>
          </FadeIn>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          {/* Settings Overview */}
          <FadeIn delay={0}>
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/50 dark:to-purple-800/30 rounded-lg p-6 border hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">System Settings</h2>
                  <p className="text-muted-foreground">Configure system parameters and preferences</p>
                </div>
                <div className="hidden md:block">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-700 dark:from-purple-500 dark:to-purple-600 rounded-full flex items-center justify-center hover:scale-110 transition-transform duration-300">
                    <Settings className="h-8 w-8 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={200}>
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                  Configuration Panel
                </CardTitle>
                <p className="text-sm text-muted-foreground">Adjust system settings and application preferences</p>
              </CardHeader>
              <CardContent>
                <SystemSettings />
              </CardContent>
            </Card>
          </FadeIn>
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
}
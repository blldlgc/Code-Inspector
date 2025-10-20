import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { projectsApi } from '@/lib/api';
import { teamService } from '@/services/teamService';
import { userService } from '@/services/userService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type ShareProjectDialogProps = {
  slug: string;
  onShared?: () => void;
};

export function ShareProjectDialog({ slug, onShared }: ShareProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [teams, setTeams] = useState<{ id: number; name: string }[]>([]);
  const [users, setUsers] = useState<{ id: number; username: string; email: string }[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);
  const [username, setUsername] = useState('');
  const [visibility, setVisibility] = useState<'private' | 'team' | 'public'>('private');

  useEffect(() => {
    if (open) {
      // Load teams and users when dialog opens
      loadTeams();
      loadUsers();
    }
  }, [open]);

  const loadTeams = async () => {
    try {
      const teamsData = await teamService.list();
      setTeams(teamsData);
    } catch (error) {
      console.error('Error loading teams:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const usersData = await userService.getAllUsers();
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleShareWithUser = async () => {
    if (!username) return;
    try {
      await projectsApi.shareWithUser(slug, username);
      setUsername('');
      if (onShared) onShared();
    } catch (error) {
      console.error('Error sharing project with user:', error);
      alert('Failed to share project with user');
    }
  };

  const handleShareWithTeam = async () => {
    if (!selectedTeam) return;
    try {
      await projectsApi.shareWithTeam(slug, selectedTeam);
      setSelectedTeam(null);
      if (onShared) onShared();
    } catch (error) {
      console.error('Error sharing project with team:', error);
      alert('Failed to share project with team');
    }
  };

  const handleVisibilityChange = async () => {
    try {
      await projectsApi.update(slug, { visibility });
      if (onShared) onShared();
    } catch (error) {
      console.error('Error updating project visibility:', error);
      alert('Failed to update project visibility');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Share</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Share Project</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="user" className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="user">Share with User</TabsTrigger>
            <TabsTrigger value="team">Share with Team</TabsTrigger>
            <TabsTrigger value="visibility">Visibility</TabsTrigger>
          </TabsList>
          
          <TabsContent value="user" className="space-y-4">
            <div className="flex items-center space-x-2">
              <Select value={username} onValueChange={setUsername}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select User" />
                </SelectTrigger>
                <SelectContent>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.username}>
                      {user.username} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleShareWithUser} disabled={!username}>Share</Button>
            </div>
          </TabsContent>
          
          <TabsContent value="team" className="space-y-4">
            <div className="flex items-center space-x-2">
              <Select 
                value={selectedTeam?.toString() || ''} 
                onValueChange={(value) => setSelectedTeam(Number(value))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Team" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map(team => (
                    <SelectItem key={team.id} value={team.id.toString()}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleShareWithTeam} disabled={!selectedTeam}>Share</Button>
            </div>
          </TabsContent>
          
          <TabsContent value="visibility" className="space-y-4">
            <div className="flex flex-col space-y-4">
              <Select value={visibility} onValueChange={(v: any) => setVisibility(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">Private (Only you and shared users)</SelectItem>
                  <SelectItem value="team">Team (Visible to your teams)</SelectItem>
                  <SelectItem value="public">Public (Visible to all users)</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleVisibilityChange}>Update Visibility</Button>
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

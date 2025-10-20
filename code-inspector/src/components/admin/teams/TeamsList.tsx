import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Team, teamService } from '@/services/teamService';
import { userService } from '@/services/userService';

export function TeamsList() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [username, setUsername] = useState('');
  const [availableUsers, setAvailableUsers] = useState<{id: number; username: string; email: string}[]>([]);

  const loadTeams = async () => {
    setLoading(true);
    try {
      const data = await teamService.list();
      setTeams(data);
    } catch (error) {
      console.error('Error loading teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const users = await userService.getAllUsers();
      setAvailableUsers(users);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  useEffect(() => {
    loadTeams();
    loadUsers();
  }, []);

  const createTeam = async () => {
    if (!teamName) return;
    try {
      await teamService.create(teamName);
      setTeamName('');
      setCreateOpen(false);
      await loadTeams();
    } catch (error) {
      console.error('Error creating team:', error);
      alert('Failed to create team');
    }
  };

  const deleteTeam = async (id: number) => {
    if (!confirm('Are you sure you want to delete this team?')) return;
    try {
      await teamService.remove(id);
      await loadTeams();
    } catch (error) {
      console.error('Error deleting team:', error);
      alert('Failed to delete team');
    }
  };

  const addUserToTeam = async () => {
    if (!selectedTeam || !username) return;
    try {
      await teamService.addUser(selectedTeam.id, username);
      setUsername('');
      setAddUserOpen(false);
      await loadTeams();
    } catch (error) {
      console.error('Error adding user to team:', error);
      alert('Failed to add user to team');
    }
  };

  const removeUserFromTeam = async (teamId: number, username: string) => {
    if (!confirm(`Remove ${username} from the team?`)) return;
    try {
      await teamService.removeUser(teamId, username);
      await loadTeams();
    } catch (error) {
      console.error('Error removing user from team:', error);
      alert('Failed to remove user from team');
    }
  };

  if (loading) {
    return <div>Loading teams...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Teams</h2>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>Create Team</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Team</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Input 
                placeholder="Team Name" 
                value={teamName} 
                onChange={e => setTeamName(e.target.value)} 
              />
            </div>
            <DialogFooter>
              <Button onClick={createTeam} disabled={!teamName}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {teams.map(team => (
          <Card key={team.id} className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">{team.name}</h3>
              <div className="flex gap-2">
                <Dialog open={addUserOpen && selectedTeam?.id === team.id} onOpenChange={open => {
                  setAddUserOpen(open);
                  if (open) setSelectedTeam(team);
                }}>
                  <DialogTrigger asChild>
                    <Button variant="outline">Add User</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add User to {team.name}</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                      <select 
                        className="w-full p-2 border rounded"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                      >
                        <option value="">Select User</option>
                        {availableUsers.map(user => (
                          <option key={user.id} value={user.username}>{user.username} ({user.email})</option>
                        ))}
                      </select>
                    </div>
                    <DialogFooter>
                      <Button onClick={addUserToTeam} disabled={!username}>Add</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <Button variant="destructive" onClick={() => deleteTeam(team.id)}>Delete</Button>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">Team Members</h4>
              {team.users && team.users.length > 0 ? (
                <ul className="space-y-2">
                  {team.users.map(user => (
                    <li key={user.id} className="flex justify-between items-center p-2 bg-muted rounded">
                      <span>{user.username} ({user.email})</span>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => removeUserFromTeam(team.id, user.username)}
                      >
                        Remove
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No members in this team</p>
              )}
            </div>
          </Card>
        ))}

        {teams.length === 0 && (
          <div className="text-center p-4 border rounded">
            <p className="text-muted-foreground">No teams created yet</p>
          </div>
        )}
      </div>
    </div>
  );
}

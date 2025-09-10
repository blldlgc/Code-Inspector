import React, { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Typography,
  Box,
  Chip,
  CircularProgress,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { User } from '../../../types/user';
import { userService } from '../../../services/userService';

export const UsersList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.getAllUsers();
      setUsers(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch users. Please try again later.');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    
    try {
      await userService.deleteUser(id);
      setUsers(users.filter(user => user.id !== id));
    } catch (err) {
      setError('Failed to delete user. Please try again later.');
      console.error('Error deleting user:', err);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={2}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box p={2}>
      <Typography variant="h5" gutterBottom>
        Users Management
      </Typography>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Username</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.id}</TableCell>
                <TableCell>{user.username}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Chip
                    label={user.role}
                    color={user.role === 'ADMIN' ? 'primary' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={user.enabled ? 'Active' : 'Disabled'}
                    color={user.enabled ? 'success' : 'error'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => console.log('Edit user:', user.id)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDelete(user.id)} color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

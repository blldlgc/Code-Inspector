import axios from 'axios';
import { User, UserDTO } from '../types/user';
import { authService } from '../lib/auth';

// authService'den axios interceptor'ını kuruyoruz
authService.setupAxiosInterceptors();

export const userService = {
  async getAllUsers(): Promise<User[]> {
    try {
      const response = await axios.get('/api/admin/users');
      console.log('Users response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  async getUser(id: number): Promise<User> {
    try {
      const response = await axios.get(`/api/admin/users/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching user ${id}:`, error);
      throw error;
    }
  },

  async updateUser(id: number, userData: UserDTO): Promise<User> {
    try {
      const response = await axios.put(`/api/admin/users/${id}`, userData);
      return response.data;
    } catch (error) {
      console.error(`Error updating user ${id}:`, error);
      throw error;
    }
  },

  async deleteUser(id: number): Promise<void> {
    try {
      await axios.delete(`/api/admin/users/${id}`);
    } catch (error) {
      console.error(`Error deleting user ${id}:`, error);
      throw error;
    }
  }
};
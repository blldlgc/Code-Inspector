import axios from 'axios';
import { User, UserDTO, CreateUserRequest } from '../types/user';
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
      // Önce kullanıcıyı kontrol et
      const user = await this.getUser(id);
      
      // Admin kullanıcısını silmeye çalışıyorsa engelle
      if (user.role === 'ADMIN') {
        throw new Error('Admin kullanıcısı silinemez!');
      }

      // Silme işlemini gerçekleştir
      await axios.delete(`/api/admin/users/${id}`);
    } catch (error) {
      console.error(`Error deleting user ${id}:`, error);
      throw error;
    }
  }
  ,
  async createUser(payload: CreateUserRequest): Promise<User> {
    try {
      const response = await axios.post('/api/admin/users', payload);
      return response.data;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }
};
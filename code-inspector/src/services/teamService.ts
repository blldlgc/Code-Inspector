import axios from 'axios';

const BACKEND_BASE_URL: string = (import.meta as any).env?.VITE_BACKEND_URL || 'http://localhost:8080';

export type Team = {
  id: number;
  name: string;
  users?: { id: number; username: string; email: string }[];
};

export const teamService = {
  async list(): Promise<Team[]> {
    const { data } = await axios.get(`${BACKEND_BASE_URL}/api/teams`);
    return data;
  },
  async create(name: string): Promise<Team> {
    const { data } = await axios.post(`${BACKEND_BASE_URL}/api/teams`, { name });
    return data;
  },
  async remove(id: number): Promise<void> {
    await axios.delete(`${BACKEND_BASE_URL}/api/teams/${id}`);
  },
  async addUser(id: number, username: string): Promise<Team> {
    const { data } = await axios.post(`${BACKEND_BASE_URL}/api/teams/${id}/users`, { username });
    return data;
  },
  async removeUser(id: number, username: string): Promise<Team> {
    const { data } = await axios.delete(`${BACKEND_BASE_URL}/api/teams/${id}/users`, { data: { username } });
    return data;
  }
};




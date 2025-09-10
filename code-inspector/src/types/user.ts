export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN'
}

export interface User {
  id: number;
  username: string;
  email: string;
  enabled: boolean;
  role: UserRole;
}

export interface UserDTO extends Omit<User, 'id'> {
  id?: number;
  password?: string;
}

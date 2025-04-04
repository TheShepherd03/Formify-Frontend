export interface User {
  email: string;
  password?: string;
}

export interface AuthResponse {
  token?: string;
  user?: User;
  message?: string;
}

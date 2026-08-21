export interface AuthUser {
  id: number;
  email: string;
  name: string;
}

export interface LoginBody {
  email: string;
  password: string;
}

export interface RegisterBody {
  name: string;
  email: string;
  password: string;
  inviteCode: string;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
}

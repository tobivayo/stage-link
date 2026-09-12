export interface AuthenticatedRequestUser {
  id: string;
  email: string;
  roles: string[];
}

export interface JwtPayload {
  sub: string;
  email: string;
}

export type UserRole = 'ceo' | 'frontdesk' | 'provider' | 'marketing' | 'operations';

export interface SessionPayload {
  username: string;
  role: UserRole;
  name: string;
  iat?: number;
  exp?: number;
}

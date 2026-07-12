export type Role = 'FleetManager' | 'Dispatcher' | 'SafetyOfficer' | 'FinancialAnalyst';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface LoginResponse {
  message: string;
  token?: string;
  user?: User;
  locked?: boolean;
}

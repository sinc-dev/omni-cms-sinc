export interface CloudflareAccessPayload {
  email: string;
  name?: string;
  sub: string;
  iat: number;
  exp: number;
}

export type Permission = string; // Format: "resource:action"

export interface AuthContext {
  user: {
    id: string;
    email: string;
    name: string;
    isSuperAdmin: boolean;
  };
  organizationId?: string;
  permissions: Permission[];
}

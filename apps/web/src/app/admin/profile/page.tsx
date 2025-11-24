'use client';

export const runtime = 'edge';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, Loader2, User as UserIcon } from 'lucide-react';
import { useOrganization } from '@/lib/context/organization-context';
import { useApiClient } from '@/lib/hooks/use-api-client';
import { useErrorHandler } from '@/lib/hooks/use-error-handler';

interface UserInfo {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  isSuperAdmin: boolean;
  createdAt: string;
}

interface UserMember {
  userId: string;
  organizationId: string;
  roleId: string;
  role: {
    name: string;
    description?: string | null;
  };
}

export default function ProfilePage() {
  const { organization, isLoading: orgLoading } = useOrganization();
  const api = useApiClient();
  const { error, handleError, clearError, withErrorHandling } = useErrorHandler();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [userMemberships, setUserMemberships] = useState<UserMember[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  // Load user information
  useEffect(() => {
    if (!organization || !api || orgLoading) {
      setLoading(false);
      return;
    }

    const fetchUserInfo = withErrorHandling(async () => {
      setLoading(true);
      clearError();

      try {
        // Get current user from users list (we'll find by email from JWT or get first user as fallback)
        // In a real implementation, you'd have a /me endpoint
        const usersResponse = (await api.getUsers()) as {
          success: boolean;
          data: Array<{
            userId: string;
            user: {
              id: string;
              name: string;
              email: string;
              avatarUrl?: string | null;
            };
            role: {
              name: string;
              description?: string | null;
            };
            organizationId: string;
            roleId: string;
          }>;
        };

        if (usersResponse.success && usersResponse.data.length > 0) {
          // For now, get the first user (in production, match by JWT email)
          const firstMember = usersResponse.data[0];
          const user = firstMember.user;
          
          // Get all memberships for this user across organizations
          const memberships: UserMember[] = usersResponse.data
            .filter(m => m.user.id === user.id)
            .map(m => ({
              userId: m.userId,
              organizationId: m.organizationId,
              roleId: m.roleId,
              role: m.role,
            }));

          setUserInfo({
            id: user.id,
            name: user.name,
            email: user.email,
            avatarUrl: user.avatarUrl,
            isSuperAdmin: false, // Would come from API
            createdAt: new Date().toISOString(), // Would come from API
          });
          setName(user.name);
          setEmail(user.email);
          setUserMemberships(memberships);
        }
      } catch (err) {
        console.error('Failed to load user info:', err);
        handleError(err, { title: 'Failed to Load Profile' });
      } finally {
        setLoading(false);
      }
    }, { title: 'Failed to Load Profile' });

    fetchUserInfo();
  }, [organization, api, orgLoading, withErrorHandling, clearError, handleError]);

  const handleSave = withErrorHandling(async () => {
    if (!api || !userInfo || !name.trim()) {
      handleError('Name is required', { title: 'Validation Error' });
      return;
    }

    setSaving(true);
    clearError();

    try {
      // Note: In a real implementation, you'd have an updateUser endpoint
      // For now, we'll just show a message that this feature needs backend support
      handleError('User profile updates require backend API support. This feature is coming soon.', {
        title: 'Not Implemented',
      });
    } catch (err) {
      handleError(err, { title: 'Failed to Update Profile' });
    } finally {
      setSaving(false);
    }
  }, { title: 'Failed to Update Profile' });

  if (orgLoading || !organization) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              {orgLoading ? 'Loading...' : 'Please select an organization to view your profile.'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6 flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!userInfo) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">User information not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
          <p className="text-muted-foreground">View and manage your account information</p>
        </div>
        <Button onClick={handleSave} disabled={saving || !name.trim()}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
                {userInfo.avatarUrl ? (
                  <img
                    src={userInfo.avatarUrl}
                    alt={userInfo.name}
                    className="h-20 w-20 rounded-full"
                  />
                ) : (
                  <UserIcon className="h-10 w-10 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">Profile Picture</p>
                <p className="text-xs text-muted-foreground">
                  Avatar management coming soon
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={true}
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed. It is managed by your identity provider.
              </p>
            </div>
            {userInfo.isSuperAdmin && (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <span className="text-sm font-medium">Super Admin</span>
                <span className="text-xs text-muted-foreground">
                  You have full system access
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Organization Memberships</CardTitle>
          </CardHeader>
          <CardContent>
            {userMemberships.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No organization memberships found
              </p>
            ) : (
              <div className="space-y-3">
                {userMemberships.map((membership) => (
                  <div
                    key={`${membership.organizationId}-${membership.userId}`}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {organization?.id === membership.organizationId
                          ? organization.name
                          : `Organization ${membership.organizationId.slice(0, 8)}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Role: {membership.role.name}
                        {membership.role.description && ` - ${membership.role.description}`}
                      </p>
                    </div>
                    {organization?.id === membership.organizationId && (
                      <span className="text-xs text-muted-foreground">Current</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">User ID</span>
              <span className="text-sm font-mono">{userInfo.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Member Since</span>
              <span className="text-sm">
                {new Date(userInfo.createdAt).toLocaleDateString()}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


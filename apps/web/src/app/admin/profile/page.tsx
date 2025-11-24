'use client';

export const runtime = 'edge';
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, Loader2, User as UserIcon, Upload, X } from 'lucide-react';
import NextImage from 'next/image';
import { useOrganization } from '@/lib/context/organization-context';
import { useErrorHandler } from '@/lib/hooks/use-error-handler';
import { apiClient } from '@/lib/api-client';

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
  const { error, handleError, clearError, withErrorHandling } = useErrorHandler();
  
  // Note: Profile operations use apiClient directly (don't require organization)
  // Organization-scoped operations use apiClient with organization ID directly
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [userMemberships, setUserMemberships] = useState<UserMember[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load user information
  useEffect(() => {
    if (orgLoading) {
      return;
    }

    const fetchUserInfo = withErrorHandling(async () => {
      setLoading(true);
      clearError();

      try {
        // Get current user profile (doesn't require organization)
        const userResponse = (await apiClient.getCurrentUser()) as {
          success: boolean;
          data: UserInfo;
        };

        if (userResponse.success && userResponse.data) {
          const user = userResponse.data;
          setUserInfo(user);
          setName(user.name);
          setEmail(user.email);

          // Also fetch organization memberships if organization is available
          if (organization) {
            try {
              // Use apiClient directly with organization ID for this call
              const usersResponse = (await apiClient.getUsers(organization.id)) as {
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
                const memberships: UserMember[] = usersResponse.data
                  .filter(m => m.user.id === user.id)
                  .map(m => ({
                    userId: m.userId,
                    organizationId: m.organizationId,
                    roleId: m.roleId,
                    role: m.role,
                  }));
                setUserMemberships(memberships);
              }
            } catch (err) {
              // Silently fail - memberships are optional
              console.error('Failed to load memberships:', err);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load user info:', err);
        handleError(err, { title: 'Failed to Load Profile' });
      } finally {
        setLoading(false);
      }
    }, { title: 'Failed to Load Profile' });

    fetchUserInfo();
  }, [orgLoading, organization, withErrorHandling, clearError, handleError]);

  const handleSave = withErrorHandling(async () => {
    if (!userInfo || !name.trim()) {
      handleError('Name is required', { title: 'Validation Error' });
      return;
    }

    setSaving(true);
    clearError();

    try {
      // Profile update doesn't require organization
      const response = (await apiClient.updateProfile({ name })) as {
        success: boolean;
        data: UserInfo;
      };

      if (response.success && response.data) {
        setUserInfo(response.data);
        setName(response.data.name);
        // Show success message or handle success state
      }
    } catch (err) {
      handleError(err, { title: 'Failed to Update Profile' });
    } finally {
      setSaving(false);
    }
  }, { title: 'Failed to Update Profile' });

  const handleAvatarUpload = withErrorHandling(async (file: File) => {
    if (!organization) {
      handleError('Please select an organization to upload avatar', { title: 'Upload Error' });
      return;
    }

    setUploadingAvatar(true);
    clearError();

    try {
      // Get image dimensions
      let width: number | undefined;
      let height: number | undefined;

      if (file.type.startsWith('image/')) {
        const img = new Image();
        const url = URL.createObjectURL(file);
        await new Promise((resolve, reject) => {
          img.onload = () => {
            width = img.width;
            height = img.height;
            URL.revokeObjectURL(url);
            resolve(null);
          };
          img.onerror = reject;
          img.src = url;
        });
      }

      // Request upload URL and create media record
      // Use apiClient directly with organization ID
      const uploadResponse = await apiClient.requestUploadUrl(organization.id, {
        filename: file.name,
        mimeType: file.type,
        fileSize: file.size,
        width,
        height,
      }) as unknown as {
        success: boolean;
        data: {
          uploadUrl: string;
          fileKey: string;
          publicUrl: string;
          media: {
            id: string;
            publicUrl: string;
          };
        };
      };

      if (!uploadResponse.success || !uploadResponse.data) {
        throw new Error('Failed to get upload URL');
      }

      const { uploadUrl, publicUrl } = uploadResponse.data;

      // Upload file to R2 using presigned URL
      const uploadResult = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResult.ok) {
        throw new Error('Upload to storage failed');
      }

      // Update profile with new avatar URL
      const profileResponse = (await apiClient.updateProfile({ avatarUrl: publicUrl })) as {
        success: boolean;
        data: UserInfo;
      };

      if (profileResponse.success && profileResponse.data) {
        setUserInfo(profileResponse.data);
      }
    } catch (err) {
      handleError(err, { title: 'Failed to Upload Avatar' });
    } finally {
      setUploadingAvatar(false);
    }
  }, { title: 'Failed to Upload Avatar' });

  const handleAvatarRemove = withErrorHandling(async () => {
    setUploadingAvatar(true);
    clearError();

    try {
      // Avatar removal doesn't require organization
      const response = (await apiClient.updateProfile({ avatarUrl: null })) as {
        success: boolean;
        data: UserInfo;
      };

      if (response.success && response.data) {
        setUserInfo(response.data);
      }
    } catch (err) {
      handleError(err, { title: 'Failed to Remove Avatar' });
    } finally {
      setUploadingAvatar(false);
    }
  }, { title: 'Failed to Remove Avatar' });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        handleError('Please select an image file', { title: 'Invalid File Type' });
        return;
      }

      // Validate file size (max 5MB for avatars)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        handleError('Image size must be less than 5MB', { title: 'File Too Large' });
        return;
      }

      handleAvatarUpload(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (orgLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Loading...</p>
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
              <div className="relative h-20 w-20 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                {userInfo.avatarUrl ? (
                  <NextImage
                    src={userInfo.avatarUrl}
                    alt={userInfo.name}
                    width={80}
                    height={80}
                    className="h-20 w-20 rounded-full object-cover"
                    unoptimized
                  />
                ) : (
                  <UserIcon className="h-10 w-10 text-muted-foreground" />
                )}
                {uploadingAvatar && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
                    <Loader2 className="h-6 w-6 animate-spin text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">Profile Picture</p>
                <div className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    aria-label="Upload avatar image"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar || !organization}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {userInfo.avatarUrl ? 'Change' : 'Upload'}
                  </Button>
                  {userInfo.avatarUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAvatarRemove}
                      disabled={uploadingAvatar}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Remove
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {organization ? 'JPG, PNG or GIF. Max size 5MB.' : 'Select an organization to upload avatar.'}
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


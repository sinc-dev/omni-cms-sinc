'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  Mail,
  Shield,
  User as UserIcon,
} from 'lucide-react';
import { useOrganization } from '@/lib/context/organization-context';
import { useApiClient } from '@/lib/hooks/use-api-client';
import { useErrorHandler } from '@/lib/hooks/use-error-handler';
import { FilterBar } from '@/components/filters/filter-bar';
import { useFilterParams } from '@/lib/hooks/use-filter-params';

interface UserMember {
  id: string;
  userId: string;
  organizationId: string;
  roleId: string;
  createdAt: string;
  updatedAt?: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
  };
  role: {
    id: string;
    name: string;
    description?: string | null;
    permissions: string; // JSON string
  };
}

interface Role {
  id: string;
  name: string;
  description?: string | null;
  permissions: string; // JSON string
}

interface PaginatedResponse {
  success: boolean;
  data: UserMember[];
  meta: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

export default function UsersPage() {
  const { organization, isLoading: orgLoading } = useOrganization();
  const api = useApiClient();
  const { error, handleError, clearError, withErrorHandling } = useErrorHandler();
  const { getFilter, updateFilters } = useFilterParams();
  const [users, setUsers] = useState<UserMember[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  // Get filter values from URL
  const roleFilter = getFilter('role_id') || 'all';
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserMember | null>(null);
  const [detailUser, setDetailUser] = useState<UserMember | null>(null);
  const [email, setEmail] = useState('');
  const [roleId, setRoleId] = useState('');
  const [adding, setAdding] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch roles
  useEffect(() => {
    if (!api || !organization) return;

    const fetchRoles = async () => {
      try {
        const response = (await api.getRoles()) as { success: boolean; data: Role[] };
        if (response.success) {
          setRoles(response.data);
          if (response.data.length > 0 && !roleId) {
            // Set default role (usually 'viewer' or first non-admin role)
            const defaultRole = response.data.find((r) => r.name === 'viewer') || response.data[0];
            if (defaultRole) {
              setRoleId(defaultRole.id);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load roles:', err);
      }
    };

    fetchRoles();
  }, [api, organization, roleId]);

  // Fetch users
  useEffect(() => {
    if (!organization || !api || orgLoading) {
      return;
    }

    const fetchUsers = withErrorHandling(async () => {
      setLoading(true);
      clearError();

      const params: Record<string, string> = {
        page: page.toString(),
        per_page: perPage.toString(),
      };

      if (debouncedSearch) {
        params.search = debouncedSearch;
      }

      if (roleFilter !== 'all') {
        params.role_id = roleFilter;
      }

      const response = (await api.getUsers()) as PaginatedResponse;

      // The response should include search/filter in the data
      // For now, we'll assume the API handles it
      if (response.success) {
        // Filter in client if needed (API might not handle search properly)
        let filteredData = response.data;
        if (debouncedSearch) {
          const searchLower = debouncedSearch.toLowerCase();
          filteredData = response.data.filter(
            (member) =>
              member.user.name.toLowerCase().includes(searchLower) ||
              member.user.email.toLowerCase().includes(searchLower)
          );
        }

        setUsers(filteredData);
        // Adjust total based on filtered results
        if (debouncedSearch) {
          setTotal(filteredData.length);
        } else {
          setTotal(response.meta.total);
        }
      } else {
        handleError('Failed to load users', { title: 'Failed to Load Users' });
      }
      setLoading(false);
    }, { title: 'Failed to Load Users' });

    fetchUsers();
  }, [organization, api, page, debouncedSearch, roleFilter, perPage, orgLoading, withErrorHandling, clearError, handleError]);

  const handleAddUser = withErrorHandling(async () => {
    if (!api || !email || !roleId) {
      return;
    }

    setAdding(true);
    clearError();

    await api.addUser({
      email: email.trim(),
      roleId,
    });

    // Reset form and close dialog
    setEmail('');
    setRoleId('');
    setAddDialogOpen(false);

    // Refresh users list
    setPage(1);
    setAdding(false);
  }, { title: 'Failed to Add User' });

  const handleUpdateRole = withErrorHandling(async () => {
    if (!api || !selectedUser || !roleId) {
      return;
    }

    setUpdating(true);
    clearError();

    await api.updateUserRole(selectedUser.userId, roleId);

    // Close dialog and refresh
    setEditDialogOpen(false);
    setSelectedUser(null);
    setRoleId('');

    // Refresh users list
    setPage(1);
    setUpdating(false);
  }, { title: 'Failed to Update Role' });

  const handleRemoveUser = withErrorHandling(async (userId: string, userName: string) => {
    if (!api || !confirm(`Are you sure you want to remove ${userName} from this organization?`)) {
      return;
    }

    await api.removeUser(userId);
    // Refresh users list
    setPage(1);
  }, { title: 'Failed to Remove User' });

  const handleEditClick = (user: UserMember) => {
    setSelectedUser(user);
    setRoleId(user.roleId);
    setEditDialogOpen(true);
  };

  const handleViewDetails = (user: UserMember) => {
    setDetailUser(user);
    setDetailDialogOpen(true);
  };

  const totalPages = Math.ceil(total / perPage);

  if (orgLoading || !organization) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              {orgLoading ? 'Loading...' : 'Please select an organization to view users.'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">Manage team members and permissions</p>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add User to Organization</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  User must have logged in at least once to be added.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                {/* eslint-disable-next-line jsx-a11y/control-has-associated-label */}
                <select
                  id="role"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={roleId}
                  onChange={(e) => setRoleId(e.target.value)}
                  aria-label="Select role for new user"
                  title="Select role for new user"
                >
                  <option value="">Select a role...</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name} {role.description && `- ${role.description}`}
                    </option>
                  ))}
                </select>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setAddDialogOpen(false);
                    setEmail('');
                    clearError();
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleAddUser} disabled={adding || !email || !roleId}>
                  {adding ? 'Adding...' : 'Add User'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <FilterBar
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search users by name or email..."
            quickFilters={[
              {
                key: 'role_id',
                label: 'Role',
                value: roleFilter,
                options: [
                  { value: 'all', label: 'All Roles' },
                  ...roles.map((role) => ({
                    value: role.id,
                    label: role.name,
                  })),
                ],
                onChange: (value) =>
                  updateFilters({ role_id: value === 'all' ? undefined : value }),
              },
            ]}
            onClearAll={() => {
              setSearch('');
              updateFilters({ role_id: undefined });
            }}
          />
        </CardHeader>

        <CardContent>
          {loading && (
            <div className="text-center py-12">
              <p className="text-sm text-muted-foreground">Loading users...</p>
            </div>
          )}

          {error && !adding && !updating && (
            <div className="text-center py-12">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {!loading && !error && users.length === 0 && (
            <div className="text-center py-12">
              <p className="text-sm text-muted-foreground">
                {debouncedSearch
                  ? 'No users match your search.'
                  : 'No team members yet. Invite users to collaborate.'}
              </p>
            </div>
          )}

          {!loading && !error && users.length > 0 && (
            <>
              <div className="border rounded-lg">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="h-10 px-4 text-left align-middle font-medium text-sm">
                        User
                      </th>
                      <th className="h-10 px-4 text-left align-middle font-medium text-sm">
                        Email
                      </th>
                      <th className="h-10 px-4 text-left align-middle font-medium text-sm">
                        Role
                      </th>
                      <th className="h-10 px-4 text-left align-middle font-medium text-sm">
                        Joined
                      </th>
                      <th className="h-10 px-4 text-right align-middle font-medium text-sm">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((member) => (
                      <tr key={member.id} className="border-b hover:bg-muted/50">
                        <td className="p-4 align-middle">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                              {member.user.avatarUrl ? (
                                <img
                                  src={member.user.avatarUrl}
                                  alt={member.user.name}
                                  className="h-10 w-10 rounded-full"
                                />
                              ) : (
                                <UserIcon className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                            <div>
                              <div className="font-medium">{member.user.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 align-middle text-sm text-muted-foreground">
                          {member.user.email}
                        </td>
                        <td className="p-4 align-middle">
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">{member.role.name}</span>
                          </div>
                        </td>
                        <td className="p-4 align-middle text-sm text-muted-foreground">
                          {member.createdAt
                            ? new Date(member.createdAt).toLocaleDateString()
                            : '—'}
                        </td>
                        <td className="p-4 align-middle text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleViewDetails(member)}
                              aria-label={`View details for ${member.user.name}`}
                            >
                              <UserIcon className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleEditClick(member)}
                              aria-label={`Edit role for ${member.user.name}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() =>
                                handleRemoveUser(member.userId, member.user.name)
                              }
                              aria-label={`Remove ${member.user.name}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-muted-foreground">
                    Showing {(page - 1) * perPage + 1} to {Math.min(page * perPage, total)} of{' '}
                    {total} users
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <div className="text-sm">
                      Page {page} of {totalPages}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Role Dialog */}
      <Dialog 
        open={editDialogOpen} 
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) {
            // Reset when dialog closes
            setSelectedUser(null);
            setRoleId('');
            clearError();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Update Role for {selectedUser?.user.name || 'User'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-role">Role</Label>
              {/* eslint-disable-next-line jsx-a11y/control-has-associated-label */}
              <select
                id="edit-role"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={roleId || (selectedUser?.roleId || '')}
                aria-label="Select role for user"
                title="Select role for user"
                onChange={(e) => setRoleId(e.target.value)}
              >
                <option value="">Select a role...</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name} {role.description && `- ${role.description}`}
                  </option>
                ))}
              </select>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setEditDialogOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdateRole} disabled={updating || !roleId}>
                {updating ? 'Updating...' : 'Update Role'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* User Details Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {detailUser && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                  {detailUser.user.avatarUrl ? (
                    <img
                      src={detailUser.user.avatarUrl}
                      alt={detailUser.user.name}
                      className="h-16 w-16 rounded-full"
                    />
                  ) : (
                    <UserIcon className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{detailUser.user.name}</h3>
                  <p className="text-sm text-muted-foreground">{detailUser.user.email}</p>
                </div>
              </div>

              <div className="grid gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">User ID</Label>
                  <p className="text-sm font-mono">{detailUser.user.id}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Role</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium">{detailUser.role.name}</p>
                  </div>
                  {detailUser.role.description && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {detailUser.role.description}
                    </p>
                  )}
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Member Since</Label>
                  <p className="text-sm">
                    {detailUser.createdAt
                      ? new Date(detailUser.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : '—'}
                  </p>
                </div>
                {detailUser.updatedAt && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Last Updated</Label>
                    <p className="text-sm">
                      {new Date(detailUser.updatedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setDetailDialogOpen(false);
                    setDetailUser(null);
                  }}
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setDetailDialogOpen(false);
                    handleEditClick(detailUser);
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Role
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}


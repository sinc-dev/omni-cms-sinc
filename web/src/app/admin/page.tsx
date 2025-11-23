'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Image, Users, Tags, Loader2 } from 'lucide-react';
import { useOrganization } from '@/lib/context/organization-context';
import { useApiClient } from '@/lib/hooks/use-api-client';
import { useErrorHandler } from '@/lib/hooks/use-error-handler';

interface Stats {
  title: string;
  value: string | number;
  icon: typeof FileText;
  description: string;
  loading: boolean;
}

interface PaginatedResponse {
  success: boolean;
  data: unknown[];
  meta: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

export default function AdminDashboard() {
  const { organization, isLoading: orgLoading } = useOrganization();
  const { handleError } = useErrorHandler();
  const [stats, setStats] = useState<Stats[]>([
    {
      title: 'Total Posts',
      value: '—',
      icon: FileText,
      description: 'Published and draft posts',
      loading: true,
    },
    {
      title: 'Media Files',
      value: '—',
      icon: Image,
      description: 'Images and documents',
      loading: true,
    },
    {
      title: 'Team Members',
      value: '—',
      icon: Users,
      description: 'Active users',
      loading: true,
    },
    {
      title: 'Taxonomies',
      value: '—',
      icon: Tags,
      description: 'Categories and tags',
      loading: true,
    },
  ]);

  // Get API client - hook must be called unconditionally
  // It will throw if no organization, handled in useEffect
  let api: ReturnType<typeof useApiClient> | null = null;
  try {
    api = useApiClient();
  } catch {
    // No organization selected - expected, handled in useEffect
    api = null;
  }

  // Fetch stats when organization is available
  useEffect(() => {
    if (!organization || !api || orgLoading) {
      return;
    }

    const fetchStats = async () => {
      try {
        // Fetch all stats in parallel
        const [postsRes, mediaRes, usersRes, taxonomiesRes] = await Promise.all([
          api.getPosts({ page: '1', per_page: '1' }).catch(() => null),
          api.getMedia({ page: '1', per_page: '1' }).catch(() => null),
          api.getUsers().catch(() => null),
          api.getTaxonomies().catch(() => null),
        ]);

        setStats([
          {
            title: 'Total Posts',
            value:
              postsRes && typeof postsRes === 'object' && 'meta' in postsRes
                ? (postsRes as PaginatedResponse).meta.total
                : '—',
            icon: FileText,
            description: 'Published and draft posts',
            loading: false,
          },
          {
            title: 'Media Files',
            value:
              mediaRes && typeof mediaRes === 'object' && 'meta' in mediaRes
                ? (mediaRes as PaginatedResponse).meta.total
                : '—',
            icon: Image,
            description: 'Images and documents',
            loading: false,
          },
          {
            title: 'Team Members',
            value:
              usersRes && typeof usersRes === 'object' && 'meta' in usersRes
                ? (usersRes as PaginatedResponse).meta.total
                : usersRes && typeof usersRes === 'object' && Array.isArray((usersRes as { data: unknown[] }).data)
                ? (usersRes as { data: unknown[] }).data.length
                : '—',
            icon: Users,
            description: 'Active users',
            loading: false,
          },
          {
            title: 'Taxonomies',
            value:
              taxonomiesRes && typeof taxonomiesRes === 'object' && 'meta' in taxonomiesRes
                ? (taxonomiesRes as PaginatedResponse).meta.total
                : '—',
            icon: Tags,
            description: 'Categories and tags',
            loading: false,
          },
        ]);
      } catch (error) {
        handleError(error, { title: 'Failed to Load Dashboard Stats' });
        setStats((prev) =>
          prev.map((stat) => ({ ...stat, loading: false, value: 'Error' }))
        );
      }
    };

    fetchStats();
  }, [organization, api, orgLoading]);

  if (orgLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Please select an organization to view the dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to {organization.name}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              {stat.loading ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : (
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stat.loading ? '—' : stat.value.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No recent activity to display
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Image, Users, Tags, Loader2, Clock } from 'lucide-react';
import Link from 'next/link';
import { useOrganization } from '@/lib/context/organization-context';
import { useApiClient } from '@/lib/hooks/use-api-client';
import { useErrorHandler } from '@/lib/hooks/use-error-handler';

interface ActivityItem {
  type: 'post' | 'media' | 'user';
  action: string;
  title: string;
  id: string;
  timestamp: string;
  author?: string;
}

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

function DashboardContent() {
  const { organization } = useOrganization();
  const api = useApiClient();
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

  // Fetch stats when organization is available
  useEffect(() => {
    if (!organization || !api) {
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
        ]        );
      } catch (error) {
        handleError(error, { title: 'Failed to Load Dashboard Stats' });
        setStats((prev) =>
          prev.map((stat) => ({ ...stat, loading: false, value: 'Error' }))
        );
      }
    };

    fetchStats();
  }, [organization, api, handleError]);

  if (!organization) {
    return null;
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
          <RecentActivity api={api} />
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminDashboard() {
  const { organization, isLoading: orgLoading } = useOrganization();

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

  return <DashboardContent />;
}

function RecentActivity({ api }: { api: ReturnType<typeof useApiClient> }) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!api) {
      setLoading(false);
      return;
    }

    const fetchActivity = async () => {
      setLoading(true);
      try {
        // Fetch recent posts, media, and users
        const [postsRes, mediaRes, usersRes] = await Promise.all([
          api.getPosts({ page: '1', per_page: '5' }).catch(() => null),
          api.getMedia({ page: '1', per_page: '5' }).catch(() => null),
          api.getUsers().catch(() => null),
        ]);

        const activitiesList: ActivityItem[] = [];

        // Add recent posts
        if (postsRes && typeof postsRes === 'object' && 'data' in postsRes) {
          const posts = (postsRes as { data: Array<{ id: string; title: string; updatedAt: string; author?: { name: string } }> }).data;
          posts.forEach((post) => {
            activitiesList.push({
              type: 'post',
              action: 'updated',
              title: post.title,
              id: post.id,
              timestamp: post.updatedAt,
              author: post.author?.name,
            });
          });
        }

        // Add recent media
        if (mediaRes && typeof mediaRes === 'object' && 'data' in mediaRes) {
          const media = (mediaRes as { data: Array<{ id: string; filename: string; createdAt: string }> }).data;
          media.forEach((item) => {
            activitiesList.push({
              type: 'media',
              action: 'uploaded',
              title: item.filename,
              id: item.id,
              timestamp: item.createdAt,
            });
          });
        }

        // Add recent users (limit to last 3)
        if (usersRes && typeof usersRes === 'object' && 'data' in usersRes) {
          const users = (usersRes as { data: Array<{ userId: string; createdAt: string; user: { name: string } }> }).data.slice(0, 3);
          users.forEach((member) => {
            activitiesList.push({
              type: 'user',
              action: 'added',
              title: member.user.name,
              id: member.userId,
              timestamp: member.createdAt,
            });
          });
        }

        // Sort by timestamp (most recent first) and limit to 10
        activitiesList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setActivities(activitiesList.slice(0, 10));
      } catch (err) {
        console.error('Failed to load activity:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, [api]);

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return time.toLocaleDateString();
  };

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'post':
        return <FileText className="h-4 w-4" />;
      case 'media':
        return <Image className="h-4 w-4" />;
      case 'user':
        return <Users className="h-4 w-4" />;
    }
  };

      const getActivityLink = (item: ActivityItem) => {
    // This page is deprecated - redirect to org-scoped dashboard
    // Links should use orgId from context
    switch (item.type) {
      case 'post':
        return `#`; // Will be handled by org-scoped dashboard
      case 'media':
        return `#`; // Will be handled by org-scoped dashboard
      case 'user':
        return `#`; // Will be handled by org-scoped dashboard
      default:
        return '#';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No recent activity to display
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((item, index) => (
        <Link
          key={`${item.type}-${item.id}-${index}`}
          href={getActivityLink(item)}
          className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
        >
          <div className="mt-0.5 text-muted-foreground">
            {getActivityIcon(item.type)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm">
              <span className="font-medium">{item.title}</span>{' '}
              <span className="text-muted-foreground">was {item.action}</span>
              {item.author && (
                <span className="text-muted-foreground"> by {item.author}</span>
              )}
            </p>
            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{formatTimeAgo(item.timestamp)}</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

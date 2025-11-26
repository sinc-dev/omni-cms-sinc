'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TrendingUp,
  Eye,
  Users,
  Clock,
} from 'lucide-react';
import { useOrganization } from '@/lib/context/organization-context';
import { useApiClient } from '@/lib/hooks/use-api-client';
import { useErrorHandler } from '@/lib/hooks/use-error-handler';

interface AnalyticsOverview {
  totalViews: number;
  uniqueVisitors: number;
  avgTimeOnPage: number;
  bounceRate: number;
  topPosts: Array<{
    id: string;
    title: string;
    views: number;
    uniqueViews: number;
  }>;
}

interface PostAnalytics {
  postId: string;
  title: string;
  views: number;
  uniqueViews: number;
  avgTimeOnPage: number;
  bounceRate: number;
}

export default function AnalyticsPage() {
  const { organization } = useOrganization();
  const api = useApiClient();
  const { error, handleError, clearError, withErrorHandling } = useErrorHandler();
  
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [postAnalytics, setPostAnalytics] = useState<PostAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7d');

  // Fetch guards to prevent infinite loops and redundant requests
  const isFetchingRef = useRef(false);
  const hasFetchedRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!organization || !api) {
      setLoading(false);
      return;
    }

    // Prevent multiple simultaneous requests
    if (isFetchingRef.current) {
      return;
    }

    // Abort previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const fetchAnalytics = withErrorHandling(async () => {
      isFetchingRef.current = true;
      setLoading(true);
      clearError();

      const params: Record<string, string> = {
        date_range: dateRange,
      };

      const [overviewResponse, postsResponse] = await Promise.all([
        api.getAnalytics(params) as Promise<{ success: boolean; data: AnalyticsOverview }>,
        api.getPostAnalytics(params) as Promise<{ success: boolean; data: PostAnalytics[] }>,
      ]);

      // Check if request was aborted
      if (abortController.signal.aborted) {
        return;
      }
      
      if (overviewResponse.success) {
        setOverview(overviewResponse.data);
      }
      if (postsResponse.success) {
        setPostAnalytics(postsResponse.data);
      }
      hasFetchedRef.current = true;
      setLoading(false);
      isFetchingRef.current = false;
    }, { title: 'Failed to Load Analytics' });

    fetchAnalytics();

    // Cleanup: Abort request on unmount or when dependencies change
    return () => {
      abortController.abort();
      isFetchingRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organization, dateRange]);

  if (!organization) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              Please select an organization to view analytics.
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
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Track content performance and user engagement
          </p>
        </div>
        <div className="flex gap-2">
          {['7d', '30d', '90d', 'all'].map((range) => (
            <Button
              key={range}
              variant={dateRange === range ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDateRange(range)}
            >
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : range === '90d' ? '90 Days' : 'All Time'}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-6">
          {/* Skeleton loaders for overview stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4 rounded" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-3 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
          {/* Skeleton loader for top posts */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div>
                        <Skeleton className="h-4 w-48 mb-2" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          {/* Skeleton loader for post analytics table */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : error ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Overview Stats */}
          {overview && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{overview.totalViews.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    All time page views
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Unique Visitors</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{overview.uniqueVisitors.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    Distinct users
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg. Time on Page</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{Math.round(overview.avgTimeOnPage)}s</div>
                  <p className="text-xs text-muted-foreground">
                    Average session duration
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{overview.bounceRate.toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground">
                    Single-page sessions
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Top Posts */}
          {overview && overview.topPosts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Top Posts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {overview.topPosts.map((post, index) => (
                    <div
                      key={post.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                          <span className="text-sm font-semibold text-primary">
                            {index + 1}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold">{post.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {post.views.toLocaleString()} views • {post.uniqueViews.toLocaleString()} unique
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Post Analytics Table */}
          <Card>
            <CardHeader>
              <CardTitle>Post Performance</CardTitle>
            </CardHeader>
            <CardContent>
              {postAnalytics.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No analytics data available yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Post</th>
                        <th className="text-right p-2">Views</th>
                        <th className="text-right p-2">Unique</th>
                        <th className="text-right p-2">Avg. Time</th>
                        <th className="text-right p-2">Bounce Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {postAnalytics.map((post) => (
                        <tr key={post.postId} className="border-b">
                          <td className="p-2">
                            <div className="font-medium">{post.title}</div>
                          </td>
                          <td className="text-right p-2">{post.views.toLocaleString()}</td>
                          <td className="text-right p-2">{post.uniqueViews.toLocaleString()}</td>
                          <td className="text-right p-2">{Math.round(post.avgTimeOnPage)}s</td>
                          <td className="text-right p-2">{post.bounceRate.toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}


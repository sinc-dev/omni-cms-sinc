'use client';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  Eye,
  Users,
  Clock,
} from 'lucide-react';
import { useOrganization } from '@/lib/context/organization-context';
import { useApiClient } from '@/lib/hooks/use-api-client';
import { useErrorHandler } from '@/lib/hooks/use-error-handler';
import { Spinner } from '@/components/ui/spinner';

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

  useEffect(() => {
    if (!organization) {
      setLoading(false);
      return;
    }

    const fetchAnalytics = withErrorHandling(async () => {
      setLoading(true);
      clearError();

      const params: Record<string, string> = {
        date_range: dateRange,
      };

      const [overviewResponse, postsResponse] = await Promise.all([
        api.getAnalytics(params) as Promise<{ success: boolean; data: AnalyticsOverview }>,
        api.getPostAnalytics(params) as Promise<{ success: boolean; data: PostAnalytics[] }>,
      ]);
      
      if (overviewResponse.success) {
        setOverview(overviewResponse.data);
      }
      if (postsResponse.success) {
        setPostAnalytics(postsResponse.data);
      }
      setLoading(false);
    }, { title: 'Failed to Load Analytics' });

    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organization, dateRange, api]);

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
        <div className="flex justify-center py-8">
          <Spinner />
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


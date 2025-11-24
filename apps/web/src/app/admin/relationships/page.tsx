'use client';

export const runtime = 'edge';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Network, ExternalLink, List, GitBranch } from 'lucide-react';
import { useOrganization } from '@/lib/context/organization-context';
import { useSchema } from '@/lib/context/schema-context';
import { useApiClient } from '@/lib/hooks/use-api-client';
import { useErrorHandler } from '@/lib/hooks/use-error-handler';
import { FilterBar } from '@/components/admin/filters/filter-bar';
import { useFilterParams } from '@/lib/hooks/use-filter-params';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RelationshipGraph } from '@/components/admin/relationships/relationship-graph';

interface Post {
  id: string;
  title: string;
  slug: string;
  status: string;
  postType: {
    id: string;
    name: string;
    slug: string;
  };
}

interface Relationship {
  id: string;
  fromPostId: string;
  toPostId: string;
  relationshipType: string;
  fromPost?: Post;
  toPost?: Post;
}

export default function RelationshipsPage() {
  const { organization, isLoading: orgLoading } = useOrganization();
  // Always call hooks unconditionally - React rules
  const api = useApiClient();
  const { error, clearError, withErrorHandling } = useErrorHandler();
  const { getRelationshipTypes, getRelationshipTypeColor } = useSchema();
  const { getFilter, updateFilters } = useFilterParams();
  const [posts, setPosts] = useState<Post[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'graph'>('list');
  
  // Get filter values from URL
  const selectedPostType = getFilter('post_type') || 'all';
  const selectedRelationshipType = getFilter('relationship_type') || 'all';

  useEffect(() => {
    if (!organization || !api || orgLoading) {
      return;
    }

    const fetchData = withErrorHandling(async () => {
      setLoading(true);
      clearError();

      const postsResponse = await api.getPosts({ per_page: '1000' });
      const postsData = postsResponse as { success: boolean; data: Post[] };

      if (postsData.success) {
        setPosts(postsData.data);

        // Fetch relationships for all posts
        const relationshipPromises = postsData.data.map(async (post) => {
          try {
            const relResponse = await api.getPostRelationships(post.id);
            const relData = relResponse as { success: boolean; data: Array<{ id: string; fromPostId: string; toPostId: string; relationshipType: string; relatedPost: Post | null; direction: string }> };
            if (relData.success) {
              return relData.data.map((rel) => ({
                id: rel.id,
                fromPostId: rel.fromPostId,
                toPostId: rel.toPostId,
                relationshipType: rel.relationshipType,
                fromPost: postsData.data.find((p) => p.id === rel.fromPostId),
                toPost: rel.relatedPost ?? undefined,
              }));
            }
          } catch {
            return [];
          }
          return [];
        });

        const allRelationships = (await Promise.all(relationshipPromises)).flat();
        // Deduplicate relationships
        const uniqueRelationships = Array.from(
          new Map(allRelationships.map((r) => [r.id, r])).values()
        );
        setRelationships(uniqueRelationships);
      }

      setLoading(false);
    }, { title: 'Failed to Load Relationships' });

    fetchData();
  }, [organization, api, orgLoading, withErrorHandling, clearError]);

  const postTypes = Array.from(new Set(posts.map((p) => p.postType.id))).map((id) => {
    const post = posts.find((p) => p.postType.id === id);
    return post?.postType;
  }).filter(Boolean) as Array<{ id: string; name: string; slug: string }>;

  const filteredRelationships = relationships.filter((rel) => {
    const matchesSearch =
      rel.fromPost?.title.toLowerCase().includes(search.toLowerCase()) ||
      rel.toPost?.title.toLowerCase().includes(search.toLowerCase());
    const matchesPostType =
      selectedPostType === 'all' ||
      rel.fromPost?.postType.id === selectedPostType ||
      rel.toPost?.postType.id === selectedPostType;
    const matchesRelationshipType =
      selectedRelationshipType === 'all' ||
      rel.relationshipType === selectedRelationshipType;

    return matchesSearch && matchesPostType && matchesRelationshipType;
  });

  const relationshipTypes = getRelationshipTypes();
  
  const getRelationshipTypeBadgeColor = (type: string) => {
    // Convert hex color to Tailwind classes
    const hexColor = getRelationshipTypeColor(type);
    // Map common hex colors to Tailwind classes
    const colorMap: Record<string, string> = {
      '#3b82f6': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      '#10b981': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      '#f59e0b': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      '#ef4444': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      '#8b5cf6': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      '#ec4899': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
      '#06b6d4': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
      '#84cc16': 'bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-200',
      '#f97316': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      '#6366f1': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
    };
    return colorMap[hexColor] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  if (orgLoading || !organization) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              {orgLoading ? 'Loading...' : 'Please select an organization to view relationships.'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Network className="h-8 w-8" />
          Post Relationships
        </h1>
        <p className="text-muted-foreground">
          Visualize and manage relationships between posts
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <FilterBar
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search posts..."
            quickFilters={[
              {
                key: 'post_type',
                label: 'Post Type',
                value: selectedPostType,
                options: [
                  { value: 'all', label: 'All Types' },
                  ...postTypes.map((pt) => ({
                    value: pt.id,
                    label: pt.name,
                  })),
                ],
                onChange: (value) =>
                  updateFilters({ post_type: value === 'all' ? undefined : value }),
              },
              {
                key: 'relationship_type',
                label: 'Relationship Type',
                value: selectedRelationshipType,
                options: [
                  { value: 'all', label: 'All Types' },
                  ...relationshipTypes.map((type) => ({
                    value: type,
                    label: type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' '),
                  })),
                ],
                onChange: (value) =>
                  updateFilters({ relationship_type: value === 'all' ? undefined : value }),
              },
            ]}
            onClearAll={() => {
              setSearch('');
              updateFilters({
                post_type: undefined,
                relationship_type: undefined,
              });
            }}
          />
        </CardHeader>
      </Card>

      {/* Relationships View */}
      {loading ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Loading relationships...</p>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      ) : filteredRelationships.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              No relationships found matching your filters.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'list' | 'graph')} className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              Relationships ({filteredRelationships.length})
            </h2>
            <TabsList>
              <TabsTrigger value="list">
                <List className="h-4 w-4 mr-2" />
                List
              </TabsTrigger>
              <TabsTrigger value="graph">
                <GitBranch className="h-4 w-4 mr-2" />
                Graph
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="list" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {filteredRelationships.map((rel) => {
                    if (!rel.fromPost || !rel.toPost) return null;

                    return (
                      <div
                        key={rel.id}
                        className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/admin/posts/${rel.fromPost.id}`}
                            className="font-medium hover:underline flex items-center gap-1"
                          >
                            {rel.fromPost.title}
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                          <div className="text-xs text-muted-foreground mt-1">
                            {rel.fromPost.postType.name} • {rel.fromPost.status}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getRelationshipTypeBadgeColor(rel.relationshipType)}>
                            {rel.relationshipType}
                          </Badge>
                          <span className="text-muted-foreground">→</span>
                        </div>
                        <div className="flex-1 min-w-0 text-right">
                          <Link
                            href={`/admin/posts/${rel.toPost.id}`}
                            className="font-medium hover:underline flex items-center gap-1 justify-end"
                          >
                            {rel.toPost.title}
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                          <div className="text-xs text-muted-foreground mt-1">
                            {rel.toPost.postType.name} • {rel.toPost.status}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="graph" className="space-y-4">
            <RelationshipGraph relationships={filteredRelationships} posts={posts} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}


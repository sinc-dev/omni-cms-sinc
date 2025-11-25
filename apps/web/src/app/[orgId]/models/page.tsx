'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DatabaseSchemaViewer } from '@/components/models/database-schema-viewer';
import { PostTypeSchemaViewer } from '@/components/models/post-type-schema-viewer';
import { RelationshipGraph } from '@/components/relationships/relationship-graph';
import { useOrganization } from '@/lib/context/organization-context';
import { useApiClient } from '@/lib/hooks/use-api-client';
import { useErrorHandler } from '@/lib/hooks/use-error-handler';
import { useState, useEffect } from 'react';

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

export default function ModelsPage() {
  const { organization, isLoading: orgLoading } = useOrganization();
  const api = useApiClient();
  const { error, clearError, withErrorHandling } = useErrorHandler();
  const [activeTab, setActiveTab] = useState('database');
  const [posts, setPosts] = useState<Post[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [loadingRelationships, setLoadingRelationships] = useState(false);

  // Fetch relationships data when relationships tab is active
  useEffect(() => {
    if (activeTab !== 'relationships' || !organization || orgLoading) {
      return;
    }

    const fetchRelationships = withErrorHandling(async () => {
      setLoadingRelationships(true);
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

      setLoadingRelationships(false);
    }, { title: 'Failed to Load Relationships' });

    fetchRelationships();
  }, [activeTab, organization, api, orgLoading, withErrorHandling, clearError]);

  if (orgLoading || !organization) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Content models</h1>
          <p className="text-sm text-muted-foreground">
            {orgLoading ? 'Loading...' : 'Please select an organization to view data models.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Data Models</h1>
        <p className="text-muted-foreground">
          Visualize database schema and post type structures
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="database">Database Schema</TabsTrigger>
          <TabsTrigger value="post-types">Post Type Schemas</TabsTrigger>
          <TabsTrigger value="relationships">Relationships</TabsTrigger>
        </TabsList>

        <TabsContent value="database" className="space-y-4">
          <DatabaseSchemaViewer />
        </TabsContent>

        <TabsContent value="post-types" className="space-y-4">
          <PostTypeSchemaViewer />
        </TabsContent>

        <TabsContent value="relationships" className="space-y-4">
          {loadingRelationships ? (
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
          ) : relationships.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">
                  No relationships found. Create relationships between posts to visualize them here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <RelationshipGraph relationships={relationships} posts={posts} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}


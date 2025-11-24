'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, ExternalLink } from 'lucide-react';
import { useApiClient } from '@/lib/hooks/use-api-client';
import { useErrorHandler } from '@/lib/hooks/use-error-handler';
import { useSchema } from '@/lib/context/schema-context';
import Link from 'next/link';

interface Relationship {
  id: string;
  fromPostId: string;
  toPostId: string;
  relationshipType: string;
  direction: 'incoming' | 'outgoing';
  relatedPost: {
    id: string;
    title: string;
    slug: string;
    status: string;
    postType: {
      id: string;
      name: string;
      slug: string;
    };
  } | null;
  createdAt: string;
}

interface RelationshipListProps {
  postId: string;
  onRelationshipsChange?: () => void;
}

export function RelationshipList({ postId, onRelationshipsChange }: RelationshipListProps) {
  const api = useApiClient();
  const { error, handleError, clearError, withErrorHandling } = useErrorHandler();
  const { getRelationshipTypeColor } = useSchema();
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRelationships = withErrorHandling(async () => {
      setLoading(true);
      clearError();

      const response = await api.getPostRelationships(postId);
      const data = response as { success: boolean; data: Relationship[] };

      if (data.success) {
        setRelationships(data.data);
      }

      setLoading(false);
    }, { title: 'Failed to Load Relationships' });

    fetchRelationships();
  }, [postId, api, withErrorHandling, clearError]);

  const handleDelete = withErrorHandling(async (relationshipId: string) => {
    await api.deletePostRelationship(relationshipId);
    
    // Refresh relationships
    const response = await api.getPostRelationships(postId);
    const data = response as { success: boolean; data: Relationship[] };
    if (data.success) {
      setRelationships(data.data);
    }
    
    if (onRelationshipsChange) {
      onRelationshipsChange();
    }
  }, { title: 'Failed to Delete Relationship' });

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

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading relationships...</p>;
  }

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }

  if (relationships.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No relationships defined for this post.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {relationships.map((relationship) => {
        if (!relationship.relatedPost) return null;

        return (
          <Card key={relationship.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Link
                      href={`/admin/posts/${relationship.relatedPost.id}`}
                      className="font-medium hover:underline flex items-center gap-1"
                    >
                      {relationship.relatedPost.title}
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                    <Badge className={getRelationshipTypeBadgeColor(relationship.relationshipType)}>
                      {relationship.relationshipType}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {relationship.direction === 'outgoing' ? '→' : '←'}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {relationship.relatedPost.postType.name} • {relationship.relatedPost.status}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => handleDelete(relationship.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}


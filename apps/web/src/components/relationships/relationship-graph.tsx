'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent } from '@/components/ui/card';

// Dynamically import ForceGraph2D to avoid SSR issues
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[600px] text-muted-foreground">
      Loading graph...
    </div>
  ),
});

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

interface RelationshipGraphProps {
  relationships: Relationship[];
  posts: Post[];
}

export function RelationshipGraph({ relationships, posts }: RelationshipGraphProps) {
  const graphData = useMemo(() => {
    // Create a map of all unique posts involved in relationships
    const nodeMap = new Map<string, { id: string; name: string; group: number; postType: string }>();
    
    relationships.forEach((rel) => {
      if (rel.fromPost) {
        const postTypeId = rel.fromPost.postType.id;
        nodeMap.set(rel.fromPostId, {
          id: rel.fromPostId,
          name: rel.fromPost.title,
          group: parseInt(postTypeId.slice(-1), 16) % 5 || 1, // Color by post type
          postType: rel.fromPost.postType.name,
        });
      }
      if (rel.toPost) {
        const postTypeId = rel.toPost.postType.id;
        nodeMap.set(rel.toPostId, {
          id: rel.toPostId,
          name: rel.toPost.title,
          group: parseInt(postTypeId.slice(-1), 16) % 5 || 1,
          postType: rel.toPost.postType.name,
        });
      }
    });

    const nodes = Array.from(nodeMap.values());
    
    const links = relationships
      .filter((rel) => rel.fromPost && rel.toPost)
      .map((rel) => ({
        source: rel.fromPostId,
        target: rel.toPostId,
        value: 1,
        relationshipType: rel.relationshipType,
      }));

    return { nodes, links };
  }, [relationships]);

  if (graphData.nodes.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-[600px] text-muted-foreground">
            No relationships to visualize
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="h-[600px] w-full">
          <ForceGraph2D
            graphData={graphData}
            nodeLabel={(node: any) => `${node.name}\n(${node.postType})`}
            nodeColor={(node: any) => {
              const colors = [
                '#3b82f6', // blue
                '#10b981', // green
                '#f59e0b', // orange
                '#ef4444', // red
                '#8b5cf6', // purple
              ];
              return colors[node.group - 1] || '#6b7280';
            }}
            linkLabel={(link: any) => link.relationshipType}
            linkColor={() => '#94a3b8'}
            linkWidth={2}
            nodeVal={(node: any) => 5}
            nodeCanvasObjectMode={() => 'after'}
            nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
              const label = node.name;
              const fontSize = 12 / globalScale;
              ctx.font = `${fontSize}px Sans-Serif`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillStyle = '#1f2937';
              ctx.fillText(label, node.x || 0, (node.y || 0) + 8);
            }}
            onNodeClick={(node: any) => {
              window.open(`/admin/posts/${node.id}`, '_blank');
            }}
            onLinkClick={(link: any) => {
              console.log('Link clicked:', link);
            }}
            cooldownTicks={100}
            onEngineStop={() => {
              // Graph has stabilized
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}


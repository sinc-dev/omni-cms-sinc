'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  CheckCircle2,
  XCircle,
  Clock,
  MessageSquare,
  FileText,
} from 'lucide-react';
import Link from 'next/link';
import { useOrganization } from '@/lib/context/organization-context';
import { useApiClient } from '@/lib/hooks/use-api-client';
import { useErrorHandler } from '@/lib/hooks/use-error-handler';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface PendingReview {
  id: string;
  title: string;
  slug: string;
  workflowStatus: 'pending_review' | 'approved' | 'rejected';
  author: {
    id: string;
    name: string;
    email: string;
  };
  submittedAt: string;
  comments?: Array<{
    id: string;
    comment: string;
    user: {
      id: string;
      name: string;
    };
    createdAt: string;
  }>;
}

export default function ReviewsPage() {
  const { organization } = useOrganization();
  const api = useApiClient();
  const { error, handleError, clearError, withErrorHandling } = useErrorHandler();
  
  const [pendingReviews, setPendingReviews] = useState<PendingReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<PendingReview | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (!organization) {
      setLoading(false);
      return;
    }

    const fetchPendingReviews = withErrorHandling(async () => {
      setLoading(true);
      clearError();

      const response = (await api.getPendingReviews()) as { success: boolean; data: PendingReview[] };
      
      if (response.success) {
        setPendingReviews(response.data);
      } else {
        handleError('Failed to load pending reviews', { title: 'Failed to Load Reviews' });
      }
      setLoading(false);
    }, { title: 'Failed to Load Reviews' });

    fetchPendingReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organization, api]);

  const handleApprove = withErrorHandling(async (postId: string) => {
    await api.approvePost(postId, comment ? { comment } : undefined);
    setIsDialogOpen(false);
    setSelectedPost(null);
    setComment('');
    // Refresh list
    const response = (await api.getPendingReviews()) as { success: boolean; data: PendingReview[] };
    if (response.success) {
      setPendingReviews(response.data);
    }
  }, { title: 'Failed to Approve Post' });

  const handleReject = withErrorHandling(async (postId: string) => {
    if (!comment.trim()) {
      handleError('Please provide a rejection reason', { title: 'Validation Error' });
      return;
    }

    await api.rejectPost(postId, { comment });
    setIsDialogOpen(false);
    setSelectedPost(null);
    setComment('');
    // Refresh list
    const response = (await api.getPendingReviews()) as { success: boolean; data: PendingReview[] };
    if (response.success) {
      setPendingReviews(response.data);
    }
  }, { title: 'Failed to Reject Post' });

  const openDialog = (post: PendingReview, actionType: 'approve' | 'reject') => {
    setSelectedPost(post);
    setAction(actionType);
    setComment('');
    setIsDialogOpen(true);
  };

  if (!organization) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              Please select an organization to view reviews.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Content Reviews</h1>
        <p className="text-muted-foreground">
          Review and approve content submissions
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : pendingReviews.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No pending reviews. All content has been reviewed.
            </p>
          ) : (
            <div className="space-y-4">
              {pendingReviews.map((post) => (
                <div
                  key={post.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <h3 className="font-semibold">{post.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          By {post.author.name} • {new Date(post.submittedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="outline">
                        <Clock className="mr-1 h-3 w-3" />
                        Pending Review
                      </Badge>
                    </div>
                    {post.comments && post.comments.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {post.comments.map((c) => (
                          <div key={c.id} className="text-sm text-muted-foreground">
                            <span className="font-medium">{c.user.name}:</span> {c.comment}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDialog(post, 'approve')}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDialog(post, 'reject')}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                    <Link href={`/admin/posts/${post.id}/edit`}>
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === 'approve' ? 'Approve Post' : 'Reject Post'}
            </DialogTitle>
          </DialogHeader>
          {selectedPost && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium">{selectedPost.title}</p>
                <p className="text-sm text-muted-foreground">
                  {action === 'reject' && 'Please provide a reason for rejection'}
                </p>
              </div>
              <div>
                <Label htmlFor="comment">
                  {action === 'approve' ? 'Comment (optional)' : 'Rejection Reason (required)'}
                </Label>
                <Textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={action === 'approve' ? 'Add a comment...' : 'Explain why this post is being rejected...'}
                  rows={4}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (action === 'approve') {
                      handleApprove(selectedPost.id);
                    } else {
                      handleReject(selectedPost.id);
                    }
                  }}
                  variant={action === 'reject' ? 'destructive' : 'default'}
                >
                  {action === 'approve' ? 'Approve' : 'Reject'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}


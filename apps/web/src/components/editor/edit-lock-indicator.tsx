'use client';

import { useState } from 'react';
import { AlertTriangle, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useEditLock } from '@/lib/hooks/use-edit-lock';

interface EditLockIndicatorProps {
  postId: string | null;
  onTakeOver?: () => void;
  className?: string;
}

export function EditLockIndicator({
  postId,
  onTakeOver,
  className = '',
}: EditLockIndicatorProps) {
  const { lockInfo, isLoading, error, acquireLock, takeOverLock } = useEditLock({
    postId,
    enabled: !!postId,
  });

  const [showTakeOverDialog, setShowTakeOverDialog] = useState(false);

  if (!postId || !lockInfo) {
    return null;
  }

  if (lockInfo.locked && lockInfo.lock && !lockInfo.lock.isOwner) {
    // Another user is editing
    return (
      <>
        <div
          className={`flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 ${className}`}
        >
          <AlertTriangle className="h-4 w-4" />
          <div className="flex items-center gap-2">
            <span>
              {lockInfo.lock.userName} is currently editing this post
            </span>
            {lockInfo.lock.userAvatar && (
              <img
                src={lockInfo.lock.userAvatar}
                alt={lockInfo.lock.userName}
                className="h-6 w-6 rounded-full"
              />
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTakeOverDialog(true)}
            className="ml-auto"
          >
            Take Over
          </Button>
        </div>

        <Dialog open={showTakeOverDialog} onOpenChange={setShowTakeOverDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Take Over Edit Lock?</DialogTitle>
              <DialogDescription>
                This will remove the edit lock from {lockInfo.lock.userName} and
                allow you to edit this post. The other user may lose unsaved
                changes.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowTakeOverDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  const success = await takeOverLock();
                  if (success) {
                    setShowTakeOverDialog(false);
                    onTakeOver?.();
                  }
                }}
              >
                Take Over
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  if (lockInfo.locked && lockInfo.lock && lockInfo.lock.isOwner) {
    // Current user owns the lock
    return (
      <div
        className={`flex items-center gap-2 text-sm text-muted-foreground ${className}`}
      >
        <Lock className="h-4 w-4 text-green-600" />
        <span>You are editing this post</span>
      </div>
    );
  }

  // No lock
  return null;
}


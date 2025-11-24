'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useApiClient } from './use-api-client';

interface LockInfo {
  locked: boolean;
  lock: {
    id: string;
    userId: string;
    userName: string;
    userAvatar?: string | null;
    lockedAt: Date;
    expiresAt: Date;
    isOwner: boolean;
  } | null;
}

interface UseEditLockOptions {
  postId: string | null;
  enabled?: boolean;
  refreshInterval?: number; // Check lock status every N ms
}

interface UseEditLockReturn {
  lockInfo: LockInfo | null;
  isLoading: boolean;
  error: string | null;
  acquireLock: () => Promise<boolean>;
  releaseLock: () => Promise<void>;
  takeOverLock: () => Promise<boolean>;
  refreshLock: () => Promise<void>;
}

/**
 * Hook for managing edit locks on posts
 */
export function useEditLock({
  postId,
  enabled = true,
  refreshInterval = 30000, // 30 seconds
}: UseEditLockOptions): UseEditLockReturn {
  const api = useApiClient();
  const [lockInfo, setLockInfo] = useState<LockInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const checkLockStatus = useCallback(async () => {
    if (!postId || !enabled) return;

    try {
      const response = (await api.getPostLock?.(postId)) as {
        success: boolean;
        data: LockInfo;
      };

      if (response?.success) {
        setLockInfo(response.data);
        setError(null);
      }
    } catch (err) {
      console.error('Failed to check lock status:', err);
      // Don't set error for status checks, just log
    }
  }, [postId, enabled, api]);

  const acquireLock = useCallback(async (): Promise<boolean> => {
    if (!postId || !enabled) return false;

    setIsLoading(true);
    setError(null);

    try {
      const response = (await api.acquirePostLock?.(postId)) as {
        success: boolean;
        data: { lock: unknown };
        error?: { code: string; message: string; details?: { lock: LockInfo['lock'] } };
      };

      if (response?.success) {
        setLockInfo({
          locked: true,
          lock: response.data.lock as LockInfo['lock'],
        });
        return true;
      } else if (response?.error?.code === 'CONFLICT') {
        // Another user has the lock
        setLockInfo({
          locked: true,
          lock: response.error.details?.lock || null,
        });
        setError(response.error.message || 'Post is being edited by another user');
        return false;
      } else {
        setError(response?.error?.message || 'Failed to acquire lock');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to acquire lock';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [postId, enabled, api]);

  const releaseLock = useCallback(async () => {
    if (!postId || !enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      await api.releasePostLock?.(postId);
      setLockInfo({ locked: false, lock: null });
    } catch (err) {
      console.error('Failed to release lock:', err);
      setError(err instanceof Error ? err.message : 'Failed to release lock');
    } finally {
      setIsLoading(false);
    }
  }, [postId, enabled, api]);

  const takeOverLock = useCallback(async (): Promise<boolean> => {
    if (!postId || !enabled) return false;

    setIsLoading(true);
    setError(null);

    try {
      const response = (await api.takeOverPostLock?.(postId)) as {
        success: boolean;
        data: { lock: unknown };
      };

      if (response?.success) {
        setLockInfo({
          locked: true,
          lock: response.data.lock as LockInfo['lock'],
        });
        return true;
      } else {
        setError('Failed to take over lock');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to take over lock';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [postId, enabled, api]);

  const refreshLock = useCallback(async () => {
    if (!postId || !enabled) return;

    try {
      await api.refreshPostLock?.(postId);
      // Refresh status after refreshing lock
      await checkLockStatus();
    } catch (err) {
      console.error('Failed to refresh lock:', err);
    }
  }, [postId, enabled, api, checkLockStatus]);

  // Initial lock check and periodic refresh
  useEffect(() => {
    if (!postId || !enabled) {
      setLockInfo(null);
      return;
    }

    checkLockStatus();

    // Set up periodic refresh
    if (refreshInterval > 0) {
      refreshIntervalRef.current = setInterval(checkLockStatus, refreshInterval);
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [postId, enabled, refreshInterval, checkLockStatus]);

  // Auto-release lock on unmount or when postId changes
  useEffect(() => {
    return () => {
      if (postId && lockInfo?.locked && lockInfo.lock?.isOwner) {
        // Release lock on unmount (fire and forget)
        api.releasePostLock?.(postId).catch(console.error);
      }
    };
  }, [postId, lockInfo, api]);

  return {
    lockInfo,
    isLoading,
    error,
    acquireLock,
    releaseLock,
    takeOverLock,
    refreshLock,
  };
}


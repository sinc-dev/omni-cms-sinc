'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'error';

interface PresenceManagerOptions {
  postId: string | null;
  enabled?: boolean;
  heartbeatInterval?: number; // Send heartbeat every N ms
  pollInterval?: number; // Poll for active users every N ms
  onActiveUsersChange?: (users: Array<{ id: string; name: string; avatarUrl?: string | null }>) => void;
  onConnectionStatusChange?: (status: ConnectionStatus) => void;
  api: {
    updatePresence?: (postId: string) => Promise<void>;
    getPresence?: (postId: string) => Promise<{ activeUsers: Array<unknown> }>;
  };
}

/**
 * Manages user presence for collaborative editing
 * Sends periodic heartbeats and fetches active users
 * 
 * Note: This provides presence tracking only (who's viewing).
 * Real-time collaborative editing (Y.js/CRDT) is not yet implemented.
 */
export function usePresenceManager({
  postId,
  enabled = true,
  heartbeatInterval = 30000, // 30 seconds
  pollInterval = 10000, // 10 seconds
  onActiveUsersChange,
  onConnectionStatusChange,
  api,
}: PresenceManagerOptions) {
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef<number>(0);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');

  const updateConnectionStatus = useCallback((status: ConnectionStatus) => {
    setConnectionStatus(status);
    onConnectionStatusChange?.(status);
  }, [onConnectionStatusChange]);

  const updatePresenceWithRetry = useCallback(async (postId: string, retries = 3): Promise<void> => {
    if (!api.updatePresence) return;

    try {
      await api.updatePresence(postId);
      retryCountRef.current = 0;
      if (connectionStatus !== 'connected') {
        updateConnectionStatus('connected');
      }
    } catch (error) {
      console.error('Failed to update presence:', error);
      retryCountRef.current += 1;

      if (retryCountRef.current >= retries) {
        updateConnectionStatus('error');
        // Exponential backoff: wait before retrying
        const backoffDelay = Math.min(1000 * Math.pow(2, retryCountRef.current - retries), 30000);
        setTimeout(() => {
          if (retryCountRef.current < retries * 2) {
            updatePresenceWithRetry(postId, retries);
          }
        }, backoffDelay);
      } else {
        updateConnectionStatus('connecting');
      }
    }
  }, [api, connectionStatus, updateConnectionStatus]);

  const pollActiveUsers = useCallback(async () => {
    if (!api.getPresence || !postId) return;

    try {
      const response = await api.getPresence(postId);
      if (response?.activeUsers && onActiveUsersChange) {
        onActiveUsersChange(response.activeUsers as Array<{ id: string; name: string; avatarUrl?: string | null }>);
      }
      if (connectionStatus !== 'connected') {
        updateConnectionStatus('connected');
      }
      retryCountRef.current = 0;
    } catch (error) {
      console.error('Failed to get presence:', error);
      if (connectionStatus === 'connected') {
        updateConnectionStatus('error');
      }
    }
  }, [api, postId, onActiveUsersChange, connectionStatus, updateConnectionStatus]);

  useEffect(() => {
    if (!postId || !enabled || !api.updatePresence || !api.getPresence) {
      updateConnectionStatus('disconnected');
      return;
    }

    updateConnectionStatus('connecting');

    // Initial presence update
    updatePresenceWithRetry(postId);

    // Set up heartbeat with error handling
    heartbeatRef.current = setInterval(() => {
      updatePresenceWithRetry(postId);
    }, heartbeatInterval);

    // Poll for active users with error handling
    pollActiveUsers();
    pollRef.current = setInterval(pollActiveUsers, pollInterval);

    return () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      updateConnectionStatus('disconnected');
    };
  }, [postId, enabled, heartbeatInterval, pollInterval, api, updatePresenceWithRetry, pollActiveUsers, updateConnectionStatus]);

  return {
    connectionStatus,
  };
}


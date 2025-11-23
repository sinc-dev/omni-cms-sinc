'use client';

import { useState } from 'react';
import { Users } from 'lucide-react';
import { usePresenceManager } from '@/lib/collaboration/presence-manager';
import { useApiClient } from '@/lib/hooks/use-api-client';

interface PresenceIndicatorProps {
  postId: string | null;
  className?: string;
}

export function PresenceIndicator({ postId, className = '' }: PresenceIndicatorProps) {
  const api = useApiClient();
  const [activeUsers, setActiveUsers] = useState<
    Array<{ id: string; name: string; avatarUrl?: string | null }>
  >([]);

  usePresenceManager({
    postId,
    enabled: !!postId,
    onActiveUsersChange: setActiveUsers,
    api: {
      updatePresence: async (id: string) => {
        await api.updatePostPresence?.(id);
      },
      getPresence: async (id: string) => {
        return (await api.getPostPresence?.(id)) as { activeUsers: Array<unknown> };
      },
    },
  });

  if (!postId || activeUsers.length === 0) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Users className="h-4 w-4 text-muted-foreground" />
      <div className="flex items-center gap-1">
        {activeUsers.map((user) => (
          <div
            key={user.id}
            className="flex items-center gap-1 text-sm text-muted-foreground"
            title={user.name}
          >
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="h-6 w-6 rounded-full"
              />
            ) : (
              <div className="h-6 w-6 rounded-full bg-gray-300 flex items-center justify-center text-xs">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        ))}
      </div>
      <span className="text-xs text-muted-foreground">
        {activeUsers.length} {activeUsers.length === 1 ? 'person' : 'people'} viewing
      </span>
    </div>
  );
}


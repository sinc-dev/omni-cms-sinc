'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  RotateCw,
  Copy,
  MoreVertical,
} from 'lucide-react';
import { useOrganization } from '@/lib/context/organization-context';
import { useApiClient } from '@/lib/hooks/use-api-client';
import { useToastHelpers } from '@/lib/hooks/use-toast';
import { useErrorHandler } from '@/lib/hooks/use-error-handler';
import { Badge } from '@/components/ui/badge';

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  rateLimit: number;
  revokedAt: Date | null;
  rotatedFromId: string | null;
  createdAt: Date;
  lastUsedAt: Date | null;
  expiresAt: Date | null;
}

const AVAILABLE_SCOPES = [
  { value: 'posts:read', label: 'Read Posts (All)' },
  { value: 'posts:read:published', label: 'Read Posts (Published Only)' },
  { value: 'posts:search', label: 'Search Posts' },
  { value: 'media:read', label: 'Read Media' },
  { value: 'taxonomies:read', label: 'Read Taxonomies' },
  { value: '*:read', label: 'Read All Content' },
];

export default function ApiKeysPage() {
  const { organization } = useOrganization();
  const api = useApiClient();
  const toast = useToastHelpers();
  const { error, handleError, clearError, withErrorHandling } = useErrorHandler();
  
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewKey, setShowNewKey] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyScopes, setNewKeyScopes] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!organization) return;
    fetchKeys();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organization]);

  const fetchKeys = withErrorHandling(async () => {
    if (!organization) return;
    
    setLoading(true);
    clearError();
    
    try {
      const response = await api.getApiKeys() as { success: boolean; data: ApiKey[] };
      if (response.success) {
        setKeys(response.data);
      } else {
        handleError('Failed to load API keys');
      }
    } finally {
      setLoading(false);
    }
  }, { title: 'Error Loading API Keys' });

  const handleCreateKey = withErrorHandling(async () => {
    if (!organization || !newKeyName.trim()) {
      toast.error('Please enter a name for the API key', 'Validation Error');
      return;
    }

    setIsCreating(true);
    try {
      const response = await api.createApiKey({
        name: newKeyName,
        scopes: newKeyScopes,
      }) as { success: boolean; data: { key: string; id: string } };
      
      if (response.success) {
        setNewKey(response.data.key);
        setShowNewKey(true);
        setNewKeyName('');
        setNewKeyScopes([]);
        await fetchKeys();
        toast.success('API key created successfully', 'Success');
      } else {
        handleError('Failed to create API key');
      }
    } finally {
      setIsCreating(false);
    }
  }, { title: 'Error Creating API Key' });

  const handleRotateKey = withErrorHandling(async (keyId: string) => {
    if (!organization) return;
    
    if (!confirm('Are you sure you want to rotate this API key? The old key will be immediately invalidated.')) {
      return;
    }

    try {
      const response = await api.rotateApiKey(keyId) as { success: boolean; data: { key: string } };
      if (response.success) {
        setNewKey(response.data.key);
        setShowNewKey(true);
        await fetchKeys();
        toast.success('API key rotated successfully', 'Success');
      } else {
        handleError('Failed to rotate API key');
      }
    } catch (err) {
      // Error is already handled by withErrorHandling
      throw err;
    }
  }, { title: 'Error Rotating API Key' });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard', 'Success');
  };

  if (!organization) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              Please select an organization to manage API keys.
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
          <h1 className="text-3xl font-bold tracking-tight">API Keys</h1>
          <p className="text-muted-foreground">
            Manage API keys for external integrations
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create API Key
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New API Key</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="key-name">Name</Label>
                <Input
                  id="key-name"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g., Production Website"
                />
              </div>
              <div>
                <Label>Scopes</Label>
                <div className="space-y-2 mt-2">
                  {AVAILABLE_SCOPES.map((scope) => (
                    <label key={scope.value} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={newKeyScopes.includes(scope.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewKeyScopes([...newKeyScopes, scope.value]);
                          } else {
                            setNewKeyScopes(newKeyScopes.filter(s => s !== scope.value));
                          }
                        }}
                      />
                      <span className="text-sm">{scope.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <Button onClick={handleCreateKey} disabled={isCreating}>
                {isCreating ? 'Creating...' : 'Create Key'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {showNewKey && newKey && (
        <Card className="border-green-500">
          <CardHeader>
            <CardTitle>API Key Created</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Input value={newKey} readOnly className="font-mono" />
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(newKey)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              ⚠️ Store this key securely. It will not be shown again.
            </p>
            <Button onClick={() => { setShowNewKey(false); setNewKey(null); }}>
              Close
            </Button>
          </CardContent>
        </Card>
      )}

      {loading && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Loading API keys...</p>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {!loading && !error && (
        <div className="space-y-4">
          {keys.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground text-center py-8">
                  No API keys found. Create one to get started.
                </p>
              </CardContent>
            </Card>
          ) : (
            keys.map((key) => (
              <Card key={key.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{key.name}</CardTitle>
                      <div className="flex items-center space-x-2 mt-2">
                        <code className="text-sm bg-muted px-2 py-1 rounded">
                          {key.keyPrefix}...
                        </code>
                        {key.revokedAt && (
                          <Badge variant="destructive">Revoked</Badge>
                        )}
                        {key.rotatedFromId && (
                          <Badge variant="secondary">Rotated</Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {key.scopes.map((scope) => (
                          <Badge key={scope} variant="outline" className="text-xs">
                            {scope}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {!key.revokedAt && (
                          <DropdownMenuItem onClick={() => handleRotateKey(key.id)}>
                            <RotateCw className="mr-2 h-4 w-4" />
                            Rotate Key
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Rate Limit:</span>
                      <span className="ml-2">{key.rateLimit.toLocaleString()}/hour</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Created:</span>
                      <span className="ml-2">
                        {new Date(key.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {key.lastUsedAt && (
                      <div>
                        <span className="text-muted-foreground">Last Used:</span>
                        <span className="ml-2">
                          {new Date(key.lastUsedAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {key.expiresAt && (
                      <div>
                        <span className="text-muted-foreground">Expires:</span>
                        <span className="ml-2">
                          {new Date(key.expiresAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}


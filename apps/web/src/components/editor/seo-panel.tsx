'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MediaPicker } from './media-picker';
import { Eye, AlertCircle } from 'lucide-react';

interface SEOPanelProps {
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  ogImageId: string | null;
  canonicalUrl: string;
  onMetaTitleChange: (value: string) => void;
  onMetaDescriptionChange: (value: string) => void;
  onMetaKeywordsChange: (value: string) => void;
  onOgImageChange: (imageId: string | null) => void;
  onCanonicalUrlChange: (value: string) => void;
  postTitle?: string;
  postExcerpt?: string | null;
}

export function SEOPanel({
  metaTitle,
  metaDescription,
  metaKeywords,
  ogImageId,
  canonicalUrl,
  onMetaTitleChange,
  onMetaDescriptionChange,
  onMetaKeywordsChange,
  onOgImageChange,
  onCanonicalUrlChange,
  postTitle,
  postExcerpt,
}: SEOPanelProps) {
  const [previewType, setPreviewType] = useState<'google' | 'twitter' | 'facebook'>('google');

  // Auto-generate meta description from excerpt if empty
  const handleAutoGenerate = () => {
    if (!metaDescription && postExcerpt) {
      onMetaDescriptionChange(postExcerpt.substring(0, 160));
    }
    if (!metaTitle && postTitle) {
      onMetaTitleChange(postTitle.substring(0, 60));
    }
  };

  const titleLength = metaTitle.length;
  const descriptionLength = metaDescription.length;
  const titleWarning = titleLength > 60;
  const descriptionWarning = descriptionLength > 160;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>SEO Settings</CardTitle>
          <button
            type="button"
            onClick={handleAutoGenerate}
            className="text-sm text-blue-600 hover:underline"
          >
            Auto-generate
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="metaTitle">Meta Title</Label>
            <span
              className={`text-xs ${
                titleWarning ? 'text-red-600' : 'text-muted-foreground'
              }`}
            >
              {titleLength}/60
            </span>
          </div>
          <Input
            id="metaTitle"
            placeholder={postTitle || 'Enter meta title'}
            value={metaTitle}
            onChange={(e) => onMetaTitleChange(e.target.value)}
            maxLength={60}
          />
          {titleWarning && (
            <div className="flex items-center gap-1 text-xs text-red-600">
              <AlertCircle className="h-3 w-3" />
              Title is too long for optimal SEO
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="metaDescription">Meta Description</Label>
            <span
              className={`text-xs ${
                descriptionWarning ? 'text-red-600' : 'text-muted-foreground'
              }`}
            >
              {descriptionLength}/160
            </span>
          </div>
          <Textarea
            id="metaDescription"
            placeholder={postExcerpt || 'Enter meta description'}
            value={metaDescription}
            onChange={(e) => onMetaDescriptionChange(e.target.value)}
            maxLength={160}
            rows={3}
          />
          {descriptionWarning && (
            <div className="flex items-center gap-1 text-xs text-red-600">
              <AlertCircle className="h-3 w-3" />
              Description is too long for optimal SEO
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="metaKeywords">Meta Keywords (comma-separated)</Label>
          <Input
            id="metaKeywords"
            placeholder="keyword1, keyword2, keyword3"
            value={metaKeywords}
            onChange={(e) => onMetaKeywordsChange(e.target.value)}
            maxLength={255}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="ogImage">Open Graph Image</Label>
          <MediaPicker value={ogImageId} onChange={onOgImageChange} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="canonicalUrl">Canonical URL</Label>
          <Input
            id="canonicalUrl"
            type="url"
            placeholder="https://example.com/post-slug"
            value={canonicalUrl}
            onChange={(e) => onCanonicalUrlChange(e.target.value)}
          />
        </div>

        {/* Preview */}
        <div className="space-y-2 pt-4 border-t">
          <Label>Preview</Label>
          <div className="flex gap-2 mb-2">
            <button
              type="button"
              onClick={() => setPreviewType('google')}
              className={`text-xs px-2 py-1 rounded ${
                previewType === 'google'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              Google
            </button>
            <button
              type="button"
              onClick={() => setPreviewType('twitter')}
              className={`text-xs px-2 py-1 rounded ${
                previewType === 'twitter'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              Twitter
            </button>
            <button
              type="button"
              onClick={() => setPreviewType('facebook')}
              className={`text-xs px-2 py-1 rounded ${
                previewType === 'facebook'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              Facebook
            </button>
          </div>
          <div className="border rounded p-4 bg-gray-50">
            {previewType === 'google' && (
              <div>
                <div className="text-blue-600 text-sm mb-1">
                  {canonicalUrl || 'https://example.com'}
                </div>
                <div className="text-xl text-blue-800 font-medium mb-1">
                  {metaTitle || postTitle || 'Page Title'}
                </div>
                <div className="text-sm text-gray-600">
                  {metaDescription || postExcerpt || 'Page description...'}
                </div>
              </div>
            )}
            {previewType === 'twitter' && (
              <div className="border rounded overflow-hidden bg-white">
                {ogImageId && (
                  <div className="h-48 bg-gray-200 flex items-center justify-center">
                    <Eye className="h-8 w-8 text-gray-400" />
                  </div>
                )}
                <div className="p-3">
                  <div className="text-sm font-semibold mb-1">
                    {metaTitle || postTitle || 'Page Title'}
                  </div>
                  <div className="text-sm text-gray-600">
                    {metaDescription || postExcerpt || 'Page description...'}
                  </div>
                </div>
              </div>
            )}
            {previewType === 'facebook' && (
              <div className="border rounded overflow-hidden bg-white">
                {ogImageId && (
                  <div className="h-48 bg-gray-200 flex items-center justify-center">
                    <Eye className="h-8 w-8 text-gray-400" />
                  </div>
                )}
                <div className="p-3">
                  <div className="text-xs text-gray-500 uppercase mb-1">Website</div>
                  <div className="text-sm font-semibold mb-1">
                    {metaTitle || postTitle || 'Page Title'}
                  </div>
                  <div className="text-sm text-gray-600">
                    {metaDescription || postExcerpt || 'Page description...'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


/**
 * Icon Loader Utility
 * 
 * Dynamically imports lucide-react icons to reduce bundle size.
 * Instead of importing the entire library, icons are loaded on-demand.
 */

import dynamic from 'next/dynamic';
import { ComponentType } from 'react';

/**
 * Creates a dynamically imported icon component
 * This reduces bundle size by only loading icons when needed
 */
export function createIconLoader(iconName: string): ComponentType<{ className?: string; size?: number }> {
  return dynamic(
    () =>
      import('lucide-react').then((mod) => {
        const Icon = (mod as Record<string, ComponentType<{ className?: string; size?: number }>>)[iconName];
        return Icon || (() => null);
      }),
    { ssr: false }
  );
}

/**
 * Pre-defined dynamic icon loaders for commonly used icons
 * Usage: const HomeIcon = DynamicIcons.Home;
 */
export const DynamicIcons = {
  Home: dynamic(() => import('lucide-react').then((mod) => mod.Home), { ssr: false }),
  Settings: dynamic(() => import('lucide-react').then((mod) => mod.Settings), { ssr: false }),
  User: dynamic(() => import('lucide-react').then((mod) => mod.User), { ssr: false }),
  Users: dynamic(() => import('lucide-react').then((mod) => mod.Users), { ssr: false }),
  FileText: dynamic(() => import('lucide-react').then((mod) => mod.FileText), { ssr: false }),
  Image: dynamic(() => import('lucide-react').then((mod) => mod.Image), { ssr: false }),
  Tags: dynamic(() => import('lucide-react').then((mod) => mod.Tags), { ssr: false }),
  Plus: dynamic(() => import('lucide-react').then((mod) => mod.Plus), { ssr: false }),
  Edit: dynamic(() => import('lucide-react').then((mod) => mod.Edit), { ssr: false }),
  Trash2: dynamic(() => import('lucide-react').then((mod) => mod.Trash2), { ssr: false }),
  Loader2: dynamic(() => import('lucide-react').then((mod) => mod.Loader2), { ssr: false }),
  ChevronLeft: dynamic(() => import('lucide-react').then((mod) => mod.ChevronLeft), { ssr: false }),
  ChevronRight: dynamic(() => import('lucide-react').then((mod) => mod.ChevronRight), { ssr: false }),
  Clock: dynamic(() => import('lucide-react').then((mod) => mod.Clock), { ssr: false }),
  TrendingUp: dynamic(() => import('lucide-react').then((mod) => mod.TrendingUp), { ssr: false }),
  Eye: dynamic(() => import('lucide-react').then((mod) => mod.Eye), { ssr: false }),
};


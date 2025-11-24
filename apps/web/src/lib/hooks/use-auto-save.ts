'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

export type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface UseAutoSaveOptions {
  onSave: () => Promise<void>;
  debounceMs?: number;
  enabled?: boolean;
}

interface UseAutoSaveReturn {
  status: AutoSaveStatus;
  lastSavedAt: Date | null;
  triggerSave: () => Promise<void>;
  hasUnsavedChanges: boolean;
  scheduleSave: () => void;
}

/**
 * Hook for auto-saving form data with debouncing
 * Automatically saves when user stops typing
 */
export function useAutoSave({
  onSave,
  debounceMs = 2500,
  enabled = true,
}: UseAutoSaveOptions): UseAutoSaveReturn {
  const [status, setStatus] = useState<AutoSaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef(false);
  const saveQueueRef = useRef<(() => Promise<void>)[]>([]);

  const performSave = useCallback(async () => {
    if (isSavingRef.current) {
      // Queue the save if one is already in progress
      saveQueueRef.current.push(performSave);
      return;
    }

    isSavingRef.current = true;
    setStatus('saving');

    try {
      await onSave();
      setStatus('saved');
      setLastSavedAt(new Date());
      setHasUnsavedChanges(false);
      
      // Process queued saves
      const nextSave = saveQueueRef.current.shift();
      if (nextSave) {
        setTimeout(() => nextSave(), 100);
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
      setStatus('error');
      // Retry after a delay
      setTimeout(() => {
        if (saveQueueRef.current.length === 0) {
          saveQueueRef.current.push(performSave);
        }
      }, 5000);
    } finally {
      isSavingRef.current = false;
    }
  }, [onSave]);

  const triggerSave = useCallback(async () => {
    if (!enabled) return;
    
    // Clear any pending debounced saves
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    await performSave();
  }, [enabled, performSave]);

  const scheduleSave = useCallback(() => {
    if (!enabled) return;

    setHasUnsavedChanges(true);

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Schedule new save
    timeoutRef.current = setTimeout(() => {
      performSave();
      timeoutRef.current = null;
    }, debounceMs);
  }, [enabled, debounceMs, performSave]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Expose scheduleSave for external use
  useEffect(() => {
    // This will be called by components that want to trigger auto-save
    // Components should call triggerSave() directly or use scheduleSave via a ref
  }, []);

  return {
    status,
    lastSavedAt,
    triggerSave,
    hasUnsavedChanges,
    scheduleSave,
  };
}

/**
 * Hook that tracks form changes and triggers auto-save
 */
export function useAutoSaveTrigger(
  autoSave: ReturnType<typeof useAutoSave>,
  dependencies: unknown[]
) {
  const prevDepsRef = useRef<unknown[]>([]);
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Skip first render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevDepsRef.current = dependencies;
      return;
    }

    // Check if any dependency changed
    const hasChanged = dependencies.some(
      (dep, index) => {
        const prev = prevDepsRef.current[index];
        // Deep comparison for objects
        if (typeof dep === 'object' && dep !== null && typeof prev === 'object' && prev !== null) {
          return JSON.stringify(dep) !== JSON.stringify(prev);
        }
        return dep !== prev;
      }
    );

    if (hasChanged && dependencies.length > 0) {
      // Only trigger if we have actual data
      const hasData = dependencies.some((dep) => {
        if (typeof dep === 'string') return dep.length > 0;
        if (typeof dep === 'object' && dep !== null) {
          return Object.keys(dep).length > 0;
        }
        return dep !== null && dep !== undefined;
      });

      if (hasData) {
        autoSave.scheduleSave();
      }
    }

    prevDepsRef.current = dependencies;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);
}


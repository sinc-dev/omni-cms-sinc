/**
 * Configuration check utilities
 * Helps diagnose missing bindings and environment variables
 */

import type { D1Database, R2Bucket } from '@cloudflare/workers-types';

export interface ConfigStatus {
  hasDatabase: boolean;
  hasR2Bucket: boolean;
  hasAccessConfig: boolean;
  hasAppUrl: boolean;
  errors: string[];
  warnings: string[];
}

interface CloudflareEnv {
  DB?: D1Database;
  R2_BUCKET?: R2Bucket;
}

/**
 * Checks if required configuration is available
 * This is safe to call even if bindings aren't configured
 */
export function checkConfiguration(env?: CloudflareEnv): ConfigStatus {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check database binding
  const hasDatabase = !!(env?.DB || (globalThis as { DB?: D1Database }).DB);
  if (!hasDatabase) {
    errors.push('D1 database binding (DB) is not configured');
  }

  // Check R2 bucket binding
  const hasR2Bucket = !!(env?.R2_BUCKET || (globalThis as { R2_BUCKET?: R2Bucket }).R2_BUCKET);
  if (!hasR2Bucket) {
    warnings.push('R2 bucket binding (R2_BUCKET) is not configured');
  }

  // Check Cloudflare Access configuration
  const hasAccessConfig = !!(
    process.env.CF_ACCESS_TEAM_DOMAIN && 
    process.env.CF_ACCESS_AUD
  );
  if (!hasAccessConfig) {
    errors.push('Cloudflare Access configuration is missing (CF_ACCESS_TEAM_DOMAIN or CF_ACCESS_AUD)');
  }

  // Check app URL
  const hasAppUrl = !!process.env.NEXT_PUBLIC_APP_URL;
  if (!hasAppUrl) {
    warnings.push('NEXT_PUBLIC_APP_URL is not set');
  }

  return {
    hasDatabase,
    hasR2Bucket,
    hasAccessConfig,
    hasAppUrl,
    errors,
    warnings,
  };
}

/**
 * Gets a user-friendly error message for configuration issues
 */
export function getConfigurationErrorMessage(status: ConfigStatus): string | null {
  if (status.errors.length === 0) {
    return null;
  }

  return `Configuration Error: ${status.errors.join(', ')}. Please check Cloudflare Pages settings.`;
}


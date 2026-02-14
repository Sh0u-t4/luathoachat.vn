/**
 * Dynamic import with automatic retry on chunk load errors
 * This helps handle network issues and cache mismatches after deployments
 */

interface RetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  shouldReloadOnFailure?: boolean;
}

const DEFAULT_OPTIONS: RetryOptions = {
  maxRetries: 3,
  retryDelay: 1000,
  shouldReloadOnFailure: true,
};

/**
 * Utility to retry dynamic imports with exponential backoff
 */
export async function dynamicImportWithRetry<T>(
  importFn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxRetries, retryDelay, shouldReloadOnFailure } = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries!; attempt++) {
    try {
      return await importFn();
    } catch (error: any) {
      lastError = error;

      // Check if this is a chunk loading error
      const isChunkError =
        error.name === 'ChunkLoadError' ||
        error.message?.includes('Loading chunk') ||
        error.message?.includes('Failed to fetch dynamically imported module') ||
        error.message?.includes('webpack');

      console.warn(
        `[dynamicImportWithRetry] Import failed (attempt ${attempt + 1}/${maxRetries! + 1})`,
        {
          isChunkError,
          error: error.message,
        }
      );

      // If it's the last attempt and we should reload on chunk errors
      if (attempt === maxRetries && isChunkError && shouldReloadOnFailure) {
        console.error(
          '[dynamicImportWithRetry] Max retries reached for chunk error, reloading page...'
        );
        // Store info in sessionStorage to prevent reload loop
        if (typeof window !== 'undefined') {
          const reloadCount = parseInt(
            sessionStorage.getItem('chunk_error_reload_count') || '0',
            10
          );

          // Only reload if we haven't reloaded too many times (prevent infinite loop)
          if (reloadCount < 2) {
            sessionStorage.setItem('chunk_error_reload_count', String(reloadCount + 1));
            // Clear after 30 seconds
            setTimeout(() => {
              sessionStorage.removeItem('chunk_error_reload_count');
            }, 30000);
            window.location.reload();
          } else {
            console.error('[dynamicImportWithRetry] Too many reloads, giving up');
          }
        }
      }

      // If not last attempt, wait before retrying with exponential backoff
      if (attempt < maxRetries!) {
        const delay = retryDelay! * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  // If we got here, all retries failed
  throw lastError || new Error('Dynamic import failed after retries');
}

/**
 * HOC to wrap dynamic imports with retry logic
 * Usage: const MyComponent = withRetry(() => import('./MyComponent'))
 */
export function withRetry<T>(
  importFn: () => Promise<T>,
  options?: RetryOptions
): () => Promise<T> {
  return () => dynamicImportWithRetry(importFn, options);
}

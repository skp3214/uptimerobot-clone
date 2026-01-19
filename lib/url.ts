/**
 * Get the base URL for the application
 * Prioritizes NEXT_PUBLIC_APP_URL, then falls back to VERCEL_URL
 */
export function getBaseUrl(): string {
  // In production, use the configured app URL
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL
  }
  
  // Fallback to Vercel URL if available
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  
  // Development fallback
  return 'http://localhost:3000'
}

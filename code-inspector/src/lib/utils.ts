import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// GitHub URL'den repository bilgisini çıkarır
export function parseGitHubUrl(url: string): { owner: string; repo: string; fullName: string } | null {
  if (!url) return null;
  
  try {
    // GitHub URL'lerini parse et
    const patterns = [
      /^https?:\/\/github\.com\/([^\/]+)\/([^\/]+?)(?:\.git)?(?:\/.*)?$/,
      /^git@github\.com:([^\/]+)\/([^\/]+?)(?:\.git)?$/,
      /^github\.com\/([^\/]+)\/([^\/]+?)(?:\.git)?(?:\/.*)?$/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        const owner = match[1];
        const repo = match[2];
        return {
          owner,
          repo,
          fullName: `${owner}/${repo}`
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('GitHub URL parse hatası:', error);
    return null;
  }
}

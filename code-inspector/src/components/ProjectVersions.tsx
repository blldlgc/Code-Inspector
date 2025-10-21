import { useState, useEffect } from 'react';
import { ProjectVersion, projectsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { GitBranch, Upload, History, AlertCircle, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { parseGitHubUrl } from '@/lib/utils';

interface ProjectVersionsProps {
  projectSlug: string;
  onVersionSelect: (version: ProjectVersion) => void;
  projectVcsUrl?: string;
}

export function ProjectVersions({ projectSlug, onVersionSelect, projectVcsUrl }: ProjectVersionsProps) {
  const [versions, setVersions] = useState<ProjectVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [zipMessage, setZipMessage] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [githubMessage, setGithubMessage] = useState('');
  const [githubBranch, setGithubBranch] = useState('main');
  const [isUploading, setIsUploading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [zipDialogOpen, setZipDialogOpen] = useState(false);
  const [githubDialogOpen, setGithubDialogOpen] = useState(false);
  
  // GitHub dialog açıldığında projenin GitHub URL'sini doldur
  const handleGithubDialogOpen = (open: boolean) => {
    setGithubDialogOpen(open);
    if (open && projectVcsUrl) {
      setGithubUrl(projectVcsUrl);
    }
  };
  const [commitHistory, setCommitHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  
  const fetchVersions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await projectsApi.listVersions(projectSlug);
      setVersions(response);
      
      // İlk versiyonu seç
      if (response.length > 0) {
        onVersionSelect(response[0]);
      }
    } catch (error: any) {
      console.error('Error fetching versions:', error);
      setError('Failed to load versions. Please try again later.');
      setVersions([]);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (projectSlug) {
      fetchVersions();
    }
  }, [projectSlug]);
  
  const fetchCommitHistory = async () => {
    try {
      setHistoryLoading(true);
      setHistoryError(null);
      const history = await projectsApi.getCommitHistory(projectSlug);
      setCommitHistory(history);
    } catch (error: any) {
      console.error('Error fetching commit history:', error);
      setHistoryError('Failed to load commit history. Please try again later.');
      setCommitHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };
  
  const handleZipUpload = async () => {
    if (!zipFile) return;
    
    try {
      setIsUploading(true);
      await projectsApi.createVersionFromZip(
        projectSlug, 
        zipFile, 
        zipMessage || `New version from ZIP: ${zipFile.name}`
      );
      setZipFile(null);
      setZipMessage('');
      setZipDialogOpen(false);
      await fetchVersions();
    } catch (error: any) {
      console.error('Error uploading ZIP:', error);
      alert('Failed to upload ZIP file: ' + (error.message || 'Unknown error'));
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleGitHubImport = async () => {
    if (!githubUrl) return;
    
    try {
      setIsImporting(true);
      await projectsApi.createVersionFromGitHub(
        projectSlug, 
        githubUrl, 
        githubMessage || `New version from GitHub: ${githubUrl}`,
        githubBranch
      );
      setGithubUrl('');
      setGithubMessage('');
      setGithubBranch('main');
      setGithubDialogOpen(false);
      await fetchVersions();
    } catch (error: any) {
      console.error('Error importing from GitHub:', error);
      alert('Failed to import from GitHub: ' + (error.message || 'Unknown error'));
    } finally {
      setIsImporting(false);
    }
  };
  
  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <CardTitle>Project Versions</CardTitle>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Dialog open={zipDialogOpen} onOpenChange={setZipDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex-grow sm:flex-grow-0">
                <Upload className="h-4 w-4 mr-2" />
                Upload ZIP
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload New Version</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Input 
                    type="file" 
                    accept=".zip" 
                    onChange={(e) => setZipFile(e.target.files?.[0] || null)} 
                  />
                  <Input 
                    placeholder="Version message (optional)" 
                    value={zipMessage} 
                    onChange={(e) => setZipMessage(e.target.value)} 
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  onClick={handleZipUpload} 
                  disabled={!zipFile || isUploading}
                >
                  {isUploading ? 'Uploading...' : 'Upload'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Dialog open={githubDialogOpen} onOpenChange={handleGithubDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex-grow sm:flex-grow-0">
                <GitBranch className="h-4 w-4 mr-2" />
                Import GitHub
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Import from GitHub</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Input 
                    placeholder="GitHub Repository URL" 
                    value={githubUrl} 
                    onChange={(e) => setGithubUrl(e.target.value)} 
                  />
                  <Input 
                    placeholder="Branch name (default: main)" 
                    value={githubBranch} 
                    onChange={(e) => setGithubBranch(e.target.value)} 
                  />
                  <Input 
                    placeholder="Version message (optional)" 
                    value={githubMessage} 
                    onChange={(e) => setGithubMessage(e.target.value)} 
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  onClick={handleGitHubImport} 
                  disabled={!githubUrl || isImporting}
                >
                  {isImporting ? 'Importing...' : 'Import'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Button variant="outline" size="sm" onClick={fetchCommitHistory} className="flex-grow sm:flex-grow-0">
            <History className="h-4 w-4 mr-2" />
            History
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="versions">
          <TabsList className="mb-4">
            <TabsTrigger value="versions">Versions</TabsTrigger>
            <TabsTrigger value="history">Git History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="versions">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : versions.length === 0 ? (
              <div className="text-center p-4 text-muted-foreground">
                No versions available. Upload a ZIP file or import from GitHub to create a version.
              </div>
            ) : (
              <div className="space-y-2">
                {versions.map(version => (
                  <div 
                    key={version.id} 
                    className="flex flex-col sm:flex-row sm:items-center justify-between border rounded p-3 hover:bg-muted/50 cursor-pointer gap-2"
                    onClick={() => onVersionSelect(version)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium flex items-center flex-wrap gap-2">
                        <span className="truncate">{version.versionName}</span>
                        {version.githubUrl && (() => {
                          const githubInfo = parseGitHubUrl(version.githubUrl);
                          return githubInfo ? (
                            <Badge variant="outline" className="text-xs">
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                              </svg>
                              {githubInfo.fullName}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              GitHub
                            </Badge>
                          );
                        })()}
                      </div>
                      <div className="text-sm text-muted-foreground truncate">{version.commitMessage}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                        <span>{new Date(version.createdAt).toLocaleString()}</span>
                        {version.branchName && (
                          <Badge variant="secondary" className="text-xs flex items-center gap-1">
                            <GitBranch className="w-3 h-3" />
                            {version.branchName}
                          </Badge>
                        )}
                        {version.githubUrl && (
                          <a 
                            href={version.githubUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="self-end sm:self-center" onClick={(e) => {
                      e.stopPropagation();
                      onVersionSelect(version);
                    }}>
                      Select
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="history">
            {historyError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{historyError}</AlertDescription>
              </Alert>
            )}
            
            {historyLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : commitHistory.length === 0 ? (
              <div className="text-center p-4 text-muted-foreground">
                No commit history available. Click the History button to load.
              </div>
            ) : (
              <div>
                {commitHistory.length > 5 && (
                  <div className="text-xs text-muted-foreground mb-2 px-1">
                    Showing {commitHistory.length} commits (scrollable)
                  </div>
                )}
                <div className={`space-y-2 ${commitHistory.length > 5 ? 'max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent' : ''}`}>
                  {commitHistory.map((commit, index) => (
                  <div key={index} className="border rounded p-3">
                    <div className="font-mono text-xs text-muted-foreground">{commit.hash.substring(0, 8)}</div>
                    <div className="font-medium truncate">{commit.message}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {commit.author} - {new Date(commit.date).toLocaleString()}
                    </div>
                  </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
import { useState, useEffect } from 'react';
import { ProjectVersion, projectsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GitBranch, Upload, History, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ProjectVersionsProps {
  projectSlug: string;
  onVersionSelect: (version: ProjectVersion) => void;
}

export function ProjectVersions({ projectSlug, onVersionSelect }: ProjectVersionsProps) {
  const [versions, setVersions] = useState<ProjectVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [zipMessage, setZipMessage] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [githubMessage, setGithubMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [zipDialogOpen, setZipDialogOpen] = useState(false);
  const [githubDialogOpen, setGithubDialogOpen] = useState(false);
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
        githubMessage || `New version from GitHub: ${githubUrl}`
      );
      setGithubUrl('');
      setGithubMessage('');
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
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Project Versions</CardTitle>
        <div className="flex gap-2">
          <Dialog open={zipDialogOpen} onOpenChange={setZipDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
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
          
          <Dialog open={githubDialogOpen} onOpenChange={setGithubDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
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
          
          <Button variant="outline" size="sm" onClick={fetchCommitHistory}>
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
                    className="flex items-center justify-between border rounded p-3 hover:bg-muted/50 cursor-pointer"
                    onClick={() => onVersionSelect(version)}
                  >
                    <div>
                      <div className="font-medium flex items-center">
                        {version.versionName}
                        {version.githubUrl && (
                          <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded">
                            GitHub
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">{version.commitMessage}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(version.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => onVersionSelect(version)}>
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
              <div className="space-y-2">
                {commitHistory.map((commit, index) => (
                  <div key={index} className="border rounded p-3">
                    <div className="font-mono text-xs text-muted-foreground">{commit.hash.substring(0, 8)}</div>
                    <div className="font-medium">{commit.message}</div>
                    <div className="text-xs text-muted-foreground">
                      {commit.author} - {new Date(commit.date).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
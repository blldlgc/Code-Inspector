import { useEffect, useState } from 'react';
import { projectsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

type Project = { 
  id: number; 
  name: string; 
  slug: string; 
  description?: string; 
  vcsUrl?: string; 
  visibility?: string;
  createdAt?: string;
  updatedAt?: string;
};

export default function Projects() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Project[]>([]);
  const [sortedItems, setSortedItems] = useState<Project[]>([]);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'alphabetical' | 'lastUpdated'>('newest');
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [repoAccess, setRepoAccess] = useState<'public' | 'private'>('public');
  const [branchName, setBranchName] = useState('main');
  const [githubUsername, setGithubUsername] = useState('');
  const [githubToken, setGithubToken] = useState('');
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const refresh = async () => {
    try {
      console.log("Fetching projects list...");
      const data = await projectsApi.list();
      console.log("Projects received:", data);
      setItems(data);
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  // Sıralama fonksiyonu
  const sortProjects = (projects: Project[], sortType: typeof sortBy) => {
    const sorted = [...projects].sort((a, b) => {
      switch (sortType) {
        case 'newest':
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        case 'oldest':
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        case 'alphabetical':
          return a.name.localeCompare(b.name);
        case 'lastUpdated':
          // updatedAt alanı artık en son versiyon tarihini içeriyor
          return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
        default:
          return 0;
      }
    });
    return sorted;
  };

  useEffect(() => { refresh(); }, []);

  // Sıralama değiştiğinde sortedItems'ı güncelle
  useEffect(() => {
    setSortedItems(sortProjects(items, sortBy));
  }, [items, sortBy]);

  // Tarih formatı için yardımcı fonksiyon
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Bilinmiyor';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const createProject = async () => {
    try {
      setIsCreating(true);
      await projectsApi.createWithZip({ 
        name, 
        slug, 
        description, 
        vcsUrl: repoUrl || undefined,
        branchName: branchName,
        githubUsername: repoAccess === 'private' ? (githubUsername || undefined) : undefined,
        githubToken: repoAccess === 'private' ? (githubToken || undefined) : undefined
      }, zipFile || undefined);
      setName(''); setSlug(''); setDescription(''); setRepoUrl(''); setRepoAccess('public'); setBranchName('main'); setGithubUsername(''); setGithubToken(''); setZipFile(null);
      await refresh();
      return true;
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Failed to create project');
      return false;
    } finally {
      setIsCreating(false);
    }
  };

  const uploadZip = async (p: Project) => {
    if (!zipFile) return;
    await projectsApi.uploadZip(p.slug, zipFile);
  };

  const importGit = async (p: Project) => {
    if (!repoUrl) return;
    await projectsApi.importGit(
      p.slug,
      repoUrl,
      branchName,
      repoAccess === 'private' ? githubUsername : undefined,
      repoAccess === 'private' ? githubToken : undefined
    );
  };

  const remove = async (p: Project) => {
    try {
      console.log(`Deleting project with slug: ${p.slug}`);
      await projectsApi.delete(p.slug);
      console.log(`Project deleted, removing from UI: ${p.id}`);
      
      // Silinen projeyi hemen UI'dan kaldır
      setItems(prevItems => prevItems.filter(item => item.id !== p.id));
      
      // Silme işlemi tamamlandıktan sonra biraz bekleyip backend'den tekrar yükleyelim
      setTimeout(async () => {
        console.log("Refreshing projects list after delete");
        await refresh();
      }, 1000);
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Failed to delete project');
    }
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-end">
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button>Create Project</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Project</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 gap-4 py-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <Input placeholder="Name" value={name} onChange={e => { setName(e.target.value); if (!slug) setSlug(e.target.value.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'')); }} />
                <div>
                  <Input placeholder="URL Path (no spaces)" value={slug} onChange={e => setSlug(e.target.value)} />
                  <div className="text-xs text-muted-foreground mt-1">
                    Used in project URL: /projects/<span className="font-mono">{slug || 'example-path'}</span>
                  </div>
                </div>
                <Input placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} />
                <Input placeholder="GitHub Repo URL (optional)" value={repoUrl} onChange={e => setRepoUrl(e.target.value)} />
                {repoUrl && (
                  <div className="flex items-center gap-2 text-sm">
                    <button type="button" className={`px-2 py-1 rounded border ${repoAccess==='public'?'bg-primary text-primary-foreground':''}`} onClick={() => setRepoAccess('public')}>Public</button>
                    <button type="button" className={`px-2 py-1 rounded border ${repoAccess==='private'?'bg-primary text-primary-foreground':''}`} onClick={() => setRepoAccess('private')}>Private</button>
                  </div>
                )}
                {repoUrl && (
                  <Input 
                    placeholder="Branch name (default: main)" 
                    value={branchName} 
                    onChange={e => setBranchName(e.target.value)} 
                  />
                )}
                {repoUrl && repoAccess === 'private' && (
                  <Input 
                    placeholder="GitHub Username (for private repos)" 
                    value={githubUsername} 
                    onChange={e => setGithubUsername(e.target.value)} 
                  />
                )}
                {repoUrl && repoAccess === 'private' && (
                  <Input 
                    type="password"
                    placeholder="GitHub Personal Access Token (for private repos)" 
                    value={githubToken} 
                    onChange={e => setGithubToken(e.target.value)} 
                  />
                )}
                {repoUrl && repoAccess === 'private' && (
                  <div className="text-xs text-muted-foreground mt-1 space-y-1">
                    <div><span className="text-blue-600">ℹ</span> How to create a token: <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">GitHub → Settings → Developer settings → Personal access tokens (classic) → Generate new token</a></div>
                    <div><span className="text-blue-600">ℹ</span> Required scopes: <span className="font-mono">repo</span> (and <span className="font-mono">read:org</span> if org repo)</div>
                    <div><span className="text-blue-600">ℹ</span> If org repo: open the token and click "Enable SSO" to authorize for your org</div>
                  </div>
                )}
              </div>
              
              <div className="border rounded p-2">
                <div className="text-sm font-medium mb-2">Project Files</div>
                <div className="flex items-center gap-2">
                  <Input type="file" onChange={e => setZipFile(e.target.files?.[0] || null)} />
                  <span className="text-sm opacity-70">Upload ZIP (optional)</span>
                </div>
                {repoUrl && (
                  <div className="text-xs text-muted-foreground mt-2">
                    <span className="text-green-600">✓</span> Project will be imported from GitHub after creation
                    <br />
                    <span className="text-blue-600">ℹ</span> For private repositories, GitHub token is required
                  </div>
                )}
                {isCreating && repoUrl && (
                  <div className="text-xs text-blue-500 mt-2 animate-pulse">
                    Importing files from GitHub...
                  </div>
                )}
                {isCreating && zipFile && (
                  <div className="text-xs text-blue-500 mt-2 animate-pulse">
                    Uploading ZIP file...
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button 
                onClick={async () => { 
                  const success = await createProject(); 
                  if (success) setOpenDialog(false); 
                }}
                disabled={isCreating}
              >
                {isCreating ? 'Creating...' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="font-semibold">Projects</div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Sort by:</span>
            <Select value={sortBy} onValueChange={(value: typeof sortBy) => setSortBy(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
                <SelectItem value="alphabetical">Alphabetical</SelectItem>
                <SelectItem value="lastUpdated">Last Updated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid gap-2">
          {sortedItems.map(p => (
            <div key={p.id} className="flex items-center justify-between border rounded p-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="font-medium">{p.name}</div>
                  <Badge variant="secondary" className="text-xs">
                    {p.slug}
                  </Badge>
                  {p.vcsUrl && (
                    <Badge variant="outline" className="text-xs">
                      GitHub
                    </Badge>
                  )}
                  {p.visibility && (
                    <Badge variant={p.visibility === 'public' ? 'default' : 'secondary'} className="text-xs">
                      {p.visibility === 'public' ? 'Public' : p.visibility === 'team' ? 'Team' : 'Private'}
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground mb-1">{p.description}</div>
                <div className="text-xs text-muted-foreground">
                  Last updated: {formatDate(p.updatedAt)}
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => navigate(`/projects/${p.slug}`)}>Open</Button>
                <Button variant="destructive" onClick={() => remove(p)}>Delete</Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}



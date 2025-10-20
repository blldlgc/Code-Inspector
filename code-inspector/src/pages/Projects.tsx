import { useEffect, useState } from 'react';
import { projectsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

type Project = { id: number; name: string; slug: string; description?: string; vcsUrl?: string };

export default function Projects() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Project[]>([]);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
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

  useEffect(() => { refresh(); }, []);

  const createProject = async () => {
    try {
      setIsCreating(true);
      await projectsApi.createWithZip({ name, slug, description, vcsUrl: repoUrl || undefined }, zipFile || undefined);
      setName(''); setSlug(''); setDescription(''); setRepoUrl(''); setZipFile(null);
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
    await projectsApi.importGit(p.slug, repoUrl);
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
        <div className="font-semibold">Projects</div>
        <div className="grid gap-2">
          {items.map(p => (
            <div key={p.id} className="flex items-center justify-between border rounded p-2">
              <div>
                <div className="font-medium">{p.name} <span className="opacity-60">(URL: {p.slug})</span></div>
                <div className="text-sm opacity-70">{p.description}</div>
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



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
    await projectsApi.createWithZip({ name, slug, description, vcsUrl: repoUrl || undefined }, zipFile || undefined);
    setName(''); setSlug(''); setDescription(''); setRepoUrl('');
    await refresh();
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 py-2">
              <Input placeholder="Name" value={name} onChange={e => { setName(e.target.value); if (!slug) setSlug(e.target.value.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'')); }} />
              <Input placeholder="Slug" value={slug} onChange={e => setSlug(e.target.value)} />
              <Input placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} />
              <Input placeholder="GitHub Repo URL (optional)" value={repoUrl} onChange={e => setRepoUrl(e.target.value)} />
            </div>
            <DialogFooter>
              <Button onClick={async () => { await createProject(); setOpenDialog(false); }}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="p-4 space-y-4">
        <div className="font-semibold">Projects</div>
        <div className="flex items-center gap-2">
          <Input type="file" onChange={e => setZipFile(e.target.files?.[0] || null)} />
          <span className="text-sm opacity-70">ZIP for upload endpoints</span>
        </div>
        <div className="grid gap-2">
          {items.map(p => (
            <div key={p.id} className="flex items-center justify-between border rounded p-2">
              <div>
                <div className="font-medium">{p.name} <span className="opacity-60">({p.slug})</span></div>
                <div className="text-sm opacity-70">{p.description}</div>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => navigate(`/projects/${p.slug}`)}>Open</Button>
                <Button variant="secondary" onClick={() => uploadZip(p)}>Upload ZIP</Button>
                <Button variant="secondary" onClick={() => importGit(p)}>Import Git</Button>
                <Button variant="destructive" onClick={() => remove(p)}>Delete</Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}



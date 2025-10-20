import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectFilesApi, projectsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ShareProjectDialog } from '@/components/ShareProjectDialog';

type FileInfo = { name: string; path: string; directory: boolean; size: number };
type Project = { id: number; name: string; slug: string; description?: string };

export default function ProjectDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [cwd, setCwd] = useState<string>('');
  const [items, setItems] = useState<FileInfo[]>([]);
  const [selectedPath, setSelectedPath] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editVcs, setEditVcs] = useState('');
  const [editVis, setEditVis] = useState<'private'|'team'|'public'>('private');

  const loadProject = async () => {
    const list = await projectsApi.list();
    const p = list.find(x => x.slug === slug);
    setProject(p || null);
  };

  const loadDir = async (path?: string) => {
    const data = await projectFilesApi.list(slug!, path);
    setItems(data);
    setCwd(path || '');
    setSelectedPath('');
    setContent('');
  };

  const open = async (fi: FileInfo) => {
    if (fi.directory) {
      await loadDir(fi.path);
    } else {
      setSelectedPath(fi.path);
      const txt = await projectFilesApi.read(slug!, fi.path);
      setContent(txt);
    }
  };

  useEffect(() => { loadProject(); loadDir(''); }, [slug]);
  useEffect(() => {
    if (project) {
      setEditName(project.name || '');
      setEditDesc(project.description || '');
      setEditVcs((project as any).vcsUrl || '');
    }
  }, [project]);

  const goUp = () => {
    if (!cwd) return;
    const parts = cwd.split('/');
    parts.pop();
    loadDir(parts.join('/'));
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="secondary" onClick={() => navigate('/projects')}>Back</Button>
        <div className="font-semibold">{project?.name} <span className="opacity-60">({slug})</span></div>
        <div className="ml-auto flex gap-2">
          <ShareProjectDialog slug={slug!} onShared={loadProject} />
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogTrigger asChild>
              <Button>Edit</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Project</DialogTitle>
              </DialogHeader>
              <div className="grid gap-2 py-2">
                <Input placeholder="Name" value={editName} onChange={e => setEditName(e.target.value)} />
                <Input placeholder="Description" value={editDesc} onChange={e => setEditDesc(e.target.value)} />
                <Input placeholder="GitHub Repo URL" value={editVcs} onChange={e => setEditVcs(e.target.value)} />
                <select className="border rounded p-2" value={editVis} onChange={e => setEditVis(e.target.value as any)}>
                  <option value="private">private</option>
                  <option value="team">team</option>
                  <option value="public">public</option>
                </select>
              </div>
              <DialogFooter>
                <Button onClick={async () => { await projectsApi.update(slug!, { name: editName, description: editDesc, vcsUrl: editVcs, visibility: editVis }); await loadProject(); setEditOpen(false); }}>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <Card className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <Button onClick={goUp} variant="secondary">Up</Button>
          <Input value={cwd} onChange={() => {}} readOnly />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="border rounded p-2 h-[70vh] overflow-auto">
            {items.map(fi => (
              <div key={fi.path} className="flex items-center justify-between hover:bg-muted rounded px-2 py-1 cursor-pointer" onClick={() => open(fi)}>
                <div>
                  <span className="mr-2">{fi.directory ? '📁' : '📄'}</span>
                  {fi.name}
                </div>
                {!fi.directory && <div className="text-xs opacity-60">{fi.size} B</div>}
              </div>
            ))}
          </div>
          <div className="border rounded p-2 h-[70vh] overflow-auto">
            <div className="mb-2 text-sm opacity-70">{selectedPath}</div>
            <pre className="whitespace-pre-wrap text-sm">{content}</pre>
          </div>
        </div>
      </Card>
    </div>
  );
}



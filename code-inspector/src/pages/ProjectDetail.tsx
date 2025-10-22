import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { projectsApi, projectFilesApi, ProjectVersion } from '@/lib/api';
import { ShareProjectDialog } from '@/components/ShareProjectDialog';
import { ProjectVersions } from '@/components/ProjectVersions';
import { VersionCompare } from '@/components/VersionCompare';
import { parseGitHubUrl } from '@/lib/utils';
import { GitBranch } from 'lucide-react';

export default function ProjectDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  
  const [project, setProject] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [cwd, setCwd] = useState('');
  const [selectedPath, setSelectedPath] = useState('');
  const [content, setContent] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editVcs, setEditVcs] = useState('');
  const [editVis, setEditVis] = useState<'private' | 'team' | 'public'>('private');
  const [activeVersion, setActiveVersion] = useState<ProjectVersion | null>(null);
  
  const loadProject = async () => {
    try {
      const p = await projectsApi.get(slug!);
      setProject(p);
      setEditName(p.name);
      setEditDesc(p.description || '');
      setEditVcs(p.vcsUrl || '');
      setEditVis(p.visibility || 'private');
    } catch (error) {
      console.error('Error loading project:', error);
    }
  };
  
  const loadDir = async (path: string) => {
    try {
      const files = await projectFilesApi.list(slug!, path);
      setItems(files);
      setCwd(path || '');
    } catch (error) {
      console.error('Error loading directory:', error);
    }
  };
  
  const open = async (fi: any) => {
    if (fi.directory) {
      await loadDir(fi.path);
    } else {
      try {
        setSelectedPath(fi.path);
        const text = await projectFilesApi.read(slug!, fi.path);
        setContent(text);
      } catch (error) {
        console.error('Error reading file:', error);
        setContent('Error loading file content');
      }
    }
  };
  
  const goUp = async () => {
    if (!cwd) return;
    const parts = cwd.split('/');
    parts.pop();
    await loadDir(parts.join('/'));
  };
  
  const handleVersionSelect = async (version: ProjectVersion) => {
    setActiveVersion(version);
    try {
      // Seçilen versiyona geç
      await projectsApi.checkoutVersion(slug!, version.id);
      // Dosya listesini yenile
      await loadDir(cwd);
      // İçeriği temizle
      setSelectedPath('');
      setContent('');
    } catch (error) {
      console.error('Error switching version:', error);
    }
  };
  
  useEffect(() => {
    if (slug) {
      loadProject();
      loadDir('');
    }
  }, [slug]);
  
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="secondary" onClick={() => navigate('/projects')}>Back</Button>
        <div className="font-semibold">
          {project?.name} 
          <span className="opacity-60"> (URL Path: {slug})</span>
          {project?.vcsUrl && (() => {
            const githubInfo = parseGitHubUrl(project.vcsUrl);
            return githubInfo ? (
              <div className="flex items-center gap-2 ml-2">
                <Badge variant="outline">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                  </svg>
                  {githubInfo.fullName}
                </Badge>
                {activeVersion?.branchName && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <GitBranch className="w-3 h-3" />
                    {activeVersion.branchName}
                  </Badge>
                )}
              </div>
            ) : null;
          })()}
        </div>
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
                <select className="border rounded p-2" value={editVis} onChange={e => setEditVis(e.target.value as 'private' | 'team' | 'public')}>
                  <option value="private">private</option>
                  <option value="team">team</option>
                  <option value="public">public</option>
                </select>
              </div>
              <DialogFooter>
                <Button onClick={async () => { 
                  await projectsApi.update(slug!, { 
                    name: editName, 
                    description: editDesc, 
                    vcsUrl: editVcs, 
                    visibility: editVis 
                  }); 
                  await loadProject(); 
                  setEditOpen(false); 
                }}>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-1">
          <ProjectVersions 
            projectSlug={slug!} 
            onVersionSelect={handleVersionSelect}
            projectVcsUrl={project?.vcsUrl}
          />
        </div>
        
        <div className="md:col-span-2">
          <Tabs defaultValue="files">
            <TabsList>
              <TabsTrigger value="files">Files</TabsTrigger>
              <TabsTrigger value="compare">Compare</TabsTrigger>
              <TabsTrigger value="analysis">Analysis</TabsTrigger>
            </TabsList>
            
            <TabsContent value="files">
              <Card className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Button onClick={goUp} variant="secondary">Up</Button>
                  <Input value={cwd} onChange={() => {}} readOnly />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="border rounded p-2 h-[70vh] overflow-auto">
                    {items.map(fi => (
                      <div 
                        key={fi.path} 
                        className="flex items-center justify-between hover:bg-muted rounded px-2 py-1 cursor-pointer" 
                        onClick={() => open(fi)}
                      >
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
            </TabsContent>
            
            <TabsContent value="compare">
              <VersionCompare projectSlug={slug!} />
            </TabsContent>
            
            <TabsContent value="analysis">
              {activeVersion ? (
                <AnalysisTab 
                  projectSlug={slug!} 
                  versionId={activeVersion.id} 
                />
              ) : (
                <Card className="p-4 text-center">
                  <p>Select a version to see analysis results</p>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

// Analiz sonuçları için bileşen
function AnalysisTab({ projectSlug, versionId }: { projectSlug: string, versionId: number }) {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [activeAnalysis, setActiveAnalysis] = useState<string | null>(null);
  
  const fetchResults = async () => {
    try {
      setLoading(true);
      const response = await projectsApi.getAnalysisResults(projectSlug, versionId);
      setResults(response);
      
      if (response.length > 0) {
        setActiveAnalysis(response[0].analysisType);
      }
    } catch (error) {
      console.error('Error fetching analysis results:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const runAnalysis = async (analysisType: string) => {
    try {
      setAnalyzing(true);
      await projectsApi.analyzeVersion(projectSlug, versionId, analysisType);
      await fetchResults();
      setActiveAnalysis(analysisType);
    } catch (error) {
      console.error('Error running analysis:', error);
    } finally {
      setAnalyzing(false);
    }
  };
  
  useEffect(() => {
    if (projectSlug && versionId) {
      fetchResults();
    }
  }, [projectSlug, versionId]);
  
  const getResultContent = () => {
    if (!activeAnalysis) return null;
    
    const result = results.find(r => r.analysisType === activeAnalysis);
    if (!result) return null;
    
    try {
      const data = JSON.parse(result.resultData);
      return (
        <pre className="p-4 bg-muted/30 rounded overflow-auto">
          {JSON.stringify(data, null, 2)}
        </pre>
      );
    } catch (e) {
      return <div className="text-red-500">Invalid JSON data</div>;
    }
  };
  
  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Analysis Results</h3>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => runAnalysis('code-quality')}
            disabled={analyzing}
          >
            Run Quality Analysis
          </Button>
          <Button 
            variant="outline" 
            onClick={() => runAnalysis('security')}
            disabled={analyzing}
          >
            Run Security Analysis
          </Button>
          <Button 
            variant="outline" 
            onClick={() => runAnalysis('coverage')}
            disabled={analyzing}
          >
            Run Coverage Analysis
          </Button>
          <Button 
            variant="outline" 
            onClick={() => runAnalysis('code-smell')}
            disabled={analyzing}
          >
            Run Code Smell Analysis
          </Button>
        </div>
      </div>
      
      {analyzing && (
        <div className="text-center p-4 animate-pulse">
          Running analysis, please wait...
        </div>
      )}
      
      {loading ? (
        <div className="text-center p-4">
          Loading analysis results...
        </div>
      ) : results.length === 0 ? (
        <div className="text-center p-4">
          No analysis results available. Run an analysis to see results.
        </div>
      ) : (
        <div className="space-y-4">
          <Tabs value={activeAnalysis || ''} onValueChange={setActiveAnalysis}>
            <TabsList>
              {results.map(result => (
                <TabsTrigger key={result.id} value={result.analysisType}>
                  {result.analysisType}
                </TabsTrigger>
              ))}
            </TabsList>
            
            <TabsContent value={activeAnalysis || ''}>
              {getResultContent()}
            </TabsContent>
          </Tabs>
        </div>
      )}
    </Card>
  );
}
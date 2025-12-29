import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { projectsApi, projectFilesApi, ProjectVersion, CodeGraphResponse } from '@/lib/api';
import { ShareProjectDialog } from '@/components/ShareProjectDialog';
import { ProjectVersions } from '@/components/ProjectVersions';
import { VersionCompare } from '@/components/VersionCompare';
import { parseGitHubUrl } from '@/lib/utils';
import { GitBranch } from 'lucide-react';
import ForceGraph2D from 'react-force-graph-2d';
import { VoiceReader } from '@/components/VoiceReader';

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
    <div className="w-full py-8 px-6 space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="secondary" onClick={() => navigate('/projects')}>Back</Button>
        <div className="font-semibold flex items-center gap-2 flex-wrap">
          {project?.name} 
          <Badge variant="outline" className="text-xs">
            {slug}
          </Badge>
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
                  <div className="border rounded p-2 h-[60vh] overflow-auto">
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
                  <div className="border rounded p-2 h-[60vh] overflow-auto">
                    <div className="mb-2 text-sm opacity-70">{selectedPath}</div>
                    <pre className="whitespace-pre-wrap text-sm">{content}</pre>
                  </div>
                </div>
              </Card>
            </TabsContent>
            
            <TabsContent value="compare">
              <div className="h-[60vh] overflow-auto">
                <VersionCompare projectSlug={slug!} />
              </div>
            </TabsContent>
            
            <TabsContent value="analysis">
              <div className="h-[60vh] overflow-auto">
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
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

// Analiz sonuçları için bileşen
function AnalysisTab({ projectSlug, versionId }: { projectSlug: string, versionId: number }) {
  const [duplicatedLinesDialogOpen, setDuplicatedLinesDialogOpen] = useState(false);
  const [selectedDuplicatedLines, setSelectedDuplicatedLines] = useState<string[]>([]);
  const [selectedPairInfo, setSelectedPairInfo] = useState<{file1: string, file2: string} | null>(null);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [activeAnalysis, setActiveAnalysis] = useState<string | null>(null);
  const [runAllProgress, setRunAllProgress] = useState<number>(0);
  const [projectGraph, setProjectGraph] = useState<CodeGraphResponse | null>(null);
  const [projectGraphError, setProjectGraphError] = useState<string | null>(null);
  const [projectGraphLoading, setProjectGraphLoading] = useState(false);
  
  // Graph ref'i component seviyesinde tanımla
  const graphRef = useRef<any>(null);
  const graphContainerRef = useRef<HTMLDivElement>(null);
  const [graphDimensions, setGraphDimensions] = useState({ width: 600, height: 600 });
  
  // Container boyutlarını güncelle
  useEffect(() => {
    const updateDimensions = () => {
      if (graphContainerRef.current) {
        // clientWidth/clientHeight border dahil iç alanı verir (daha doğru)
        const width = graphContainerRef.current.clientWidth;
        const height = graphContainerRef.current.clientHeight;
        setGraphDimensions({ width, height });
      }
    };
    
    updateDimensions();
    // ResizeObserver kullanarak daha hassas takip
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (graphContainerRef.current) {
      resizeObserver.observe(graphContainerRef.current);
    }
    window.addEventListener('resize', updateDimensions);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);
  
  // Graph verisini component seviyesinde hesapla
  const graphData = useMemo(() => {
    if (!projectGraph) {
      return { nodes: [], links: [] };
    }
    
    // Benzersiz node ID'leri oluştur
    const nodeMap = new Map();
    projectGraph.vertices.forEach((vertex, index) => {
      const isHub = vertex.id === '__ROOT__' || vertex.metrics?.isHub === true;
      nodeMap.set(vertex.id, {
        id: vertex.id,
        label: vertex.label,
        type: vertex.type,
        color: isHub ? '#E74C3C' : (vertex.type === 'class' ? '#8E44AD' : '#27AE60'), // Hub node kırmızı
        size: isHub ? 12 : (vertex.type === 'class' ? 8 : 6), // Hub node daha büyük
        index: index,
        isHub: isHub,
        ...vertex.metrics
      });
    });

    // Debug: Edge'leri ve node'ları kontrol et
    const dependsEdges = projectGraph.edges.filter(e => e.type === 'depends');
    const filteredOutEdges: any[] = [];
    
    // Geçerli linkleri oluştur - sadece class-to-class depends edge'leri için özel kontrol
    const links = projectGraph.edges
      .filter(edge => {
        const sourceExists = nodeMap.has(edge.source);
        const targetExists = nodeMap.has(edge.target);
        
        // Eğer edge filtreleniyorsa ve depends tipindeyse, debug bilgisi topla
        if (!sourceExists || !targetExists) {
          if (edge.type === 'depends') {
            // Source ve target'ın class olup olmadığını kontrol et
            const sourceVertex = projectGraph.vertices.find(v => v.id === edge.source);
            const targetVertex = projectGraph.vertices.find(v => v.id === edge.target);
            
            filteredOutEdges.push({
              source: edge.source,
              target: edge.target,
              sourceExists,
              targetExists,
              sourceType: sourceVertex?.type,
              targetType: targetVertex?.type,
              sourceInNodeMap: Array.from(nodeMap.keys()).includes(edge.source),
              targetInNodeMap: Array.from(nodeMap.keys()).includes(edge.target)
            });
          }
          return false;
        }
        return true;
      })
      .map(edge => ({
        source: edge.source,
        target: edge.target,
        type: edge.type,
        color: edge.type === 'depends' ? '#F39C12' : 
               edge.type === 'calls' ? '#3498DB' : // Metot-metot çağrıları için mavi
               '#34495E', // has
        width: edge.type === 'depends' ? 2 : 
               edge.type === 'calls' ? 1.5 : // Metot çağrıları için orta kalınlık
               1 // has
      }));
    
    // Debug logları - sadece sorun varsa göster
    if (dependsEdges.length > 0) {
      const validDependsLinks = links.filter(l => l.type === 'depends').length;
      if (validDependsLinks < dependsEdges.length) {
        console.log('🔍 Graph Debug Info:');
        console.log('Total depends edges from backend:', dependsEdges.length);
        console.log('Valid depends edges after filtering:', validDependsLinks);
        if (filteredOutEdges.length > 0) {
          console.warn('⚠️ Filtered out depends edges:', filteredOutEdges);
          console.log('Sample node IDs:', Array.from(nodeMap.keys()).slice(0, 5));
          console.log('Sample depends edges from backend:', dependsEdges.slice(0, 3));
        }
      }
    }

    return {
      nodes: Array.from(nodeMap.values()),
      links: links
    };
  }, [projectGraph]);
  
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

  const loadProjectGraph = async () => {
    try {
      setProjectGraphLoading(true);
      setProjectGraphError(null);
      const graph = await projectsApi.getCodeGraph(projectSlug);
      setProjectGraph(graph);
    } catch (error: any) {
      console.error('Error loading project code graph:', error);
      setProjectGraphError(error?.message || 'Code graph could not be loaded.');
    } finally {
      setProjectGraphLoading(false);
    }
  };
  
  const runAnalysis = async (analysisType: string) => {
    try {
      setAnalyzing(true);
      await projectsApi.analyzeVersion(projectSlug, versionId, analysisType);
      await fetchResults();
      setActiveAnalysis(analysisType);
      
      // Eğer code-graph analizi çalıştırılıyorsa, graph'ı da yükle
      if (analysisType === 'code-graph') {
        if (!projectGraph && !projectGraphError) {
          await loadProjectGraph();
        }
        // Graph görselleştirmesini göster
        setActiveAnalysis('project-graph');
      }
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

  const runAllAnalyses = async () => {
    try {
      setAnalyzing(true);
      setRunAllProgress(0);
      // Basit bir pseudo-progress bar, gerçek backend progress'i yoksa kullanıcıya his vermek için
      // Türkçe açıklama: setInterval ile sahte bir ilerleme göstergesi oluşturuyoruz
      const interval = setInterval(() => {
        setRunAllProgress(prev => {
          if (prev >= 90) return prev;
          return prev + 5;
        });
      }, 400);
      // Tüm analizleri backend'de tetikle
      await projectsApi.runAllAnalyses(projectSlug, versionId);
      // Sonuçları yeniden yükle
      await fetchResults();
      // Aktif analiz tipini varsa ilk elemana ayarla
      if (results.length > 0) {
        setActiveAnalysis(results[0].analysisType);
      }
      setRunAllProgress(100);
      clearInterval(interval);
    } catch (error) {
      console.error('Error running all analyses:', error);
    } finally {
      setAnalyzing(false);
    }
  };
  
  const getParsedData = (analysisType: string) => {
    // Türkçe açıklama: Her analiz tipinin JSON'unu parse edip tip bazlı görselleştirme için ortak fonksiyon
    const result = results.find(r => r.analysisType === analysisType);
    if (!result) return null;
    try {
      return JSON.parse(result.resultData);
    } catch (e) {
      return null;
    }
  };

  const renderCoverageView = () => {
    // Türkçe açıklama: Coverage analiz sonucu için progress bar ve tablo görünümü
    // Backend'den gelen gerçek veriyi kullanıyoruz
    const data = getParsedData('coverage');
    
    // Eğer veri yoksa veya geçersizse
    if (!data) {
      return (
        <div className="text-center p-4">
          <p className="text-sm text-muted-foreground">
            Coverage analizi henüz yapılmadı. Lütfen "Run Coverage Analysis" butonuna tıklayın.
          </p>
        </div>
      );
    }

    // Hata durumu kontrolü
    if (data.error) {
      return (
        <div className="space-y-4">
          <div className="p-4 border border-red-200 dark:border-red-800 rounded-md bg-red-50 dark:bg-red-950">
            <p className="text-sm font-medium text-red-800 dark:text-red-200">Hata</p>
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">{data.message || data.error}</p>
            {data.totalFiles && (
              <p className="text-xs text-red-500 dark:text-red-500 mt-2">
                Toplam dosya sayısı: {data.totalFiles}
              </p>
            )}
          </div>
        </div>
      );
    }

    // Backend'den gelen veri yapısını frontend formatına dönüştür
    const projectCoverage = Number(
      data.projectCoveragePercentage ?? data.overallCoverage ?? 0
    );
    const totalLines = Number(data.totalLines ?? 0);
    const totalCoveredLines = Number(data.totalCoveredLines ?? 0);
    const files = Array.isArray(data.files) ? data.files : [];
    const analyzedPairs = Number(data.analyzedPairs ?? 0);
    const failedAnalyses = Number(data.failedAnalyses ?? 0);
    const totalTestFiles = Number(data.totalTestFiles ?? 0);

    // Dosya verilerini frontend formatına dönüştür
    // Hata durumlarını ve başarılı analizleri ayır
    const transformedFiles = files.map((file: any) => {
      const hasError = file.error || file.errorType;
      const filePath = file.sourceFile || file.filePath || '';
      
      return {
        filePath: filePath,
        testFile: file.testFile || '',
        coveragePercentage: hasError ? 0 : Number(file.coveragePercentage ?? 0),
        coveredLines: hasError ? 0 : Number(file.coveredLines ?? 0),
        totalLines: hasError ? 0 : Number(file.totalLines ?? 0),
        hasError: hasError,
        error: file.error || file.errorType || null,
        errorMessage: file.error || null,
        errorType: file.errorType || null,
        rootCauseType: file.rootCauseType || null,
      };
    }).filter((file: any) => file.filePath); // Boş filePath'leri filtrele

    // Başarılı ve başarısız dosyaları ayır
    const successfulFiles = transformedFiles.filter((f: any) => !f.hasError);
    const failedFiles = transformedFiles.filter((f: any) => f.hasError);

    return (
      <div className="space-y-4">
        {/* Proje geneli coverage özeti */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-sm text-muted-foreground">Project Coverage</div>
            <div className="text-2xl font-semibold">{projectCoverage.toFixed(1)}%</div>
            {totalLines > 0 && (
              <div className="text-xs text-muted-foreground mt-1">
                {totalCoveredLines} / {totalLines} lines covered
              </div>
            )}
          </div>
          <div className="flex-1 max-w-md">
            <Progress value={projectCoverage} />
          </div>
        </div>

        {/* Analiz istatistikleri */}
        {(analyzedPairs > 0 || failedAnalyses > 0 || totalTestFiles > 0) && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {totalTestFiles > 0 && (
              <Card className="p-3">
                <div className="text-xs text-muted-foreground">Total Test Files</div>
                <div className="text-lg font-semibold">{totalTestFiles}</div>
              </Card>
            )}
            {analyzedPairs > 0 && (
              <Card className="p-3">
                <div className="text-xs text-muted-foreground">Analyzed Pairs</div>
                <div className="text-lg font-semibold">{analyzedPairs}</div>
              </Card>
            )}
            {failedAnalyses > 0 && (
              <Card className="p-3 border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950">
                <div className="text-xs text-muted-foreground">Failed Analyses</div>
                <div className="text-lg font-semibold text-yellow-600 dark:text-yellow-400">{failedAnalyses}</div>
              </Card>
            )}
          </div>
        )}

        {/* Hata uyarısı */}
        {failedAnalyses > 0 && (
          <div className="p-3 border border-yellow-200 dark:border-yellow-800 rounded-md bg-yellow-50 dark:bg-yellow-950">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ {failedAnalyses} analiz başarısız oldu. Bazı dosyalar için coverage bilgisi mevcut değil.
            </p>
          </div>
        )}

        {/* Dosya bazlı coverage tablosu */}
        <div className="border rounded-md max-h-80 overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="text-left px-3 py-2">File</th>
                <th className="text-right px-3 py-2">Coverage</th>
                <th className="text-right px-3 py-2">Covered / Total Lines</th>
                <th className="text-left px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {/* Başarılı analizler */}
              {successfulFiles.map((file: any, idx: number) => (
                <tr key={`success-${idx}`} className="border-t">
                  <td className="px-3 py-2 font-mono text-xs break-all">{file.filePath}</td>
                  <td className="px-3 py-2 text-right">
                    {file.coveragePercentage.toFixed(1)}%
                  </td>
                  <td className="px-3 py-2 text-right">
                    {file.coveredLines} / {file.totalLines}
                  </td>
                  <td className="px-3 py-2">
                    <Badge variant="outline" className="bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">
                      Success
                    </Badge>
                  </td>
                </tr>
              ))}
              
              {/* Başarısız analizler */}
              {failedFiles.map((file: any, idx: number) => (
                <tr key={`failed-${idx}`} className="border-t bg-red-50/30 dark:bg-red-950/20">
                  <td className="px-3 py-2 font-mono text-xs break-all">
                    <div className="space-y-1">
                      <div>{file.filePath}</div>
                      {file.testFile && (
                        <div className="text-xs text-muted-foreground">
                          Test: {file.testFile}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right text-muted-foreground">
                    N/A
                  </td>
                  <td className="px-3 py-2 text-right text-muted-foreground">
                    N/A
                  </td>
                  <td className="px-3 py-2">
                    <div className="space-y-1">
                      <Badge variant="outline" className="bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800">
                        Failed
                      </Badge>
                      {file.errorMessage && (
                        <div className="text-xs text-red-600 dark:text-red-400 mt-1 max-w-xs">
                          <details className="cursor-pointer group">
                            <summary className="hover:underline font-medium">Hata Detayları</summary>
                            <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/50 rounded border border-red-200 dark:border-red-800 text-xs space-y-1">
                              <div>
                                <span className="font-medium">Mesaj:</span>
                                <div className="break-words mt-0.5 text-red-700 dark:text-red-300">
                                  {file.errorMessage}
                                </div>
                              </div>
                              {file.errorType && (
                                <div>
                                  <span className="font-medium">Hata Tipi:</span>{' '}
                                  <span className="text-red-700 dark:text-red-300">{file.errorType}</span>
                                </div>
                              )}
                              {file.rootCauseType && file.rootCauseType !== file.errorType && (
                                <div>
                                  <span className="font-medium">Kök Neden:</span>{' '}
                                  <span className="text-red-700 dark:text-red-300">{file.rootCauseType}</span>
                                </div>
                              )}
                            </div>
                          </details>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              
              {transformedFiles.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-4 text-center text-muted-foreground">
                    {totalTestFiles === 0 
                      ? "Test dosyası bulunamadı. Coverage analizi için test dosyaları (*Test.java veya *Tests.java) gereklidir."
                      : "Dosya bazlı coverage verisi mevcut değil."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderMetricsView = () => {
    // Türkçe açıklama: Metrics analizinden proje geneli ve dosya bazlı özet kartları üretir
    const data = getParsedData('metrics');
    if (!data) {
      return <div className="text-sm text-red-500">Metrics data is not valid JSON.</div>;
    }

    const projectMetrics = data.projectMetrics || {};
    const files = Array.isArray(data.files) ? data.files : [];

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(projectMetrics).map(([key, value]) => (
            <Card key={key} className="p-3">
              <div className="text-xs text-muted-foreground">{key}</div>
              <div className="text-lg font-semibold">{String(value)}</div>
            </Card>
          ))}
          {Object.keys(projectMetrics).length === 0 && (
            <div className="col-span-2 text-sm text-muted-foreground">
              No project-level metrics available.
            </div>
          )}
        </div>

        <div className="border rounded-md max-h-80 overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="text-left px-3 py-2">File</th>
                <th className="text-left px-3 py-2">Metrics (key = value)</th>
              </tr>
            </thead>
            <tbody>
              {files.map((file: any, idx: number) => {
                const metrics = file.metrics || {};
                const metricEntries = Object.entries(metrics);
                return (
                  <tr key={idx} className="border-t align-top">
                    <td className="px-3 py-2 font-mono text-xs break-all">{file.filePath}</td>
                    <td className="px-3 py-2">
                      {metricEntries.length === 0 ? (
                        <span className="text-muted-foreground text-xs">No metrics</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {metricEntries.map(([k, v]) => (
                            <span
                              key={k}
                              className="inline-flex items-center rounded bg-muted px-2 py-0.5 text-[11px]"
                            >
                              {k}: <span className="ml-1 font-medium">{String(v)}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {files.length === 0 && (
                <tr>
                  <td colSpan={2} className="px-3 py-4 text-center text-muted-foreground">
                    No file-level metrics available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderCodeSmellView = () => {
    // Türkçe açıklama: Code smell skorlarını ve proje özetini badge'lerle listeler
    const data = getParsedData('code-smell');
    if (!data) {
      return <div className="text-sm text-red-500">Code smell data is not valid JSON.</div>;
    }

    const files = Array.isArray(data.files) ? data.files : [];

    // Türkçe açıklama: Backend şu an averageScore, analyzedFiles, totalFiles alanlarını veriyor.
    // Buradan proje geneli için özet skorlar (total score gibi) türetiyoruz.
    const computedAverage =
      data.averageScore != null && !Number.isNaN(Number(data.averageScore))
        ? Number(data.averageScore)
        : files.length > 0
        ? files.reduce(
            (sum: number, f: any) =>
              sum + (f.overallScore != null && !Number.isNaN(Number(f.overallScore)) ? Number(f.overallScore) : 0),
            0,
          ) / files.length
        : null;

    const bestFile =
      files.length > 0
        ? [...files].sort(
            (a: any, b: any) => (Number(b.overallScore ?? 0) || 0) - (Number(a.overallScore ?? 0) || 0),
          )[0]
        : null;

    const worstFile =
      files.length > 0
        ? [...files].sort(
            (a: any, b: any) => (Number(a.overallScore ?? 0) || 0) - (Number(b.overallScore ?? 0) || 0),
          )[0]
        : null;

    const baseProjectSummary =
      data.projectSummary || {
        'Analyzed Files': data.analyzedFiles ?? data.totalFiles ?? files.length,
        'Total Files': data.totalFiles ?? data.analyzedFiles ?? files.length,
        'Average Score':
          computedAverage != null ? computedAverage.toFixed(2) : files.length > 0 ? '-' : 'N/A',
        'Best File Score':
          bestFile && bestFile.overallScore != null
            ? `${bestFile.overallScore.toFixed
                ? bestFile.overallScore.toFixed(2)
                : Number(bestFile.overallScore).toFixed(2)}`
            : '-',
        'Worst File Score':
          worstFile && worstFile.overallScore != null
            ? `${worstFile.overallScore.toFixed
                ? worstFile.overallScore.toFixed(2)
                : Number(worstFile.overallScore).toFixed(2)}`
            : '-',
      };

    const projectSummary = baseProjectSummary || {};

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(projectSummary).map(([key, value]) => (
            <Card key={key} className="p-3">
              <div className="text-xs text-muted-foreground">{key}</div>
              <div className="text-lg font-semibold">{String(value)}</div>
            </Card>
          ))}
        </div>

        <div className="border rounded-md max-h-80 overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="text-left px-3 py-2">File</th>
                <th className="text-left px-3 py-2">Overall Score</th>
                <th className="text-left px-3 py-2">Smells</th>
              </tr>
            </thead>
            <tbody>
              {files.map((file: any, idx: number) => {
                const smells = file.smells || {};
                const smellEntries = Object.entries(smells);
                return (
                  <tr key={idx} className="border-t align-top">
                    <td className="px-3 py-2 font-mono text-xs break-all">{file.filePath}</td>
                    <td className="px-3 py-2">{file.overallScore ?? '-'}</td>
                    <td className="px-3 py-2">
                      {smellEntries.length === 0 ? (
                        <span className="text-muted-foreground text-xs">No smells</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {smellEntries.map(([name, value]: any) => (
                            <Badge
                              key={name}
                              variant="outline"
                              className="text-[11px] font-normal"
                            >
                              {name}: {value?.score ?? '-'}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {files.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-3 py-4 text-center text-muted-foreground">
                    No file-level code smell data available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderSecurityView = () => {
    // Türkçe açıklama: Security analizinde proje geneli risk skorlarını ve dosya bazlı zafiyet listesini gösterir
    const data = getParsedData('security');
    if (!data) {
      return <div className="text-sm text-red-500">Security data is not valid JSON.</div>;
    }

    const files = Array.isArray(data.files) ? data.files : [];

    // Türkçe açıklama: Proje seviyesi özet skorları (total score gibi) hesaplıyoruz
    const totalVulnsFromData =
      typeof data.totalVulnerabilities === 'number'
        ? data.totalVulnerabilities
        : files.reduce((sum: number, f: any) => {
            const v = f.vulnerabilities;
            if (!v || typeof v !== 'object') return sum;
            return (
              sum +
              Object.values(v).reduce((inner: number, arr: any) => {
                if (Array.isArray(arr)) return inner + arr.length;
                if (arr) return inner + 1;
                return inner;
              }, 0)
            );
          }, 0);

    const securityScores = files
      .map((f: any) => Number(f.riskMetrics?.securityScore))
      .filter(v => !Number.isNaN(v));
    const riskScores = files
      .map((f: any) => Number(f.riskMetrics?.overallRiskScore))
      .filter(v => !Number.isNaN(v));

    const avgSecurityScore =
      securityScores.length > 0
        ? securityScores.reduce((a, b) => a + b, 0) / securityScores.length
        : null;
    const avgRiskScore =
      riskScores.length > 0 ? riskScores.reduce((a, b) => a + b, 0) / riskScores.length : null;

    const highestRiskFile =
      files.length > 0
        ? [...files].sort(
            (a: any, b: any) =>
              (Number(b.riskMetrics?.overallRiskScore ?? 0) || 0) -
              (Number(a.riskMetrics?.overallRiskScore ?? 0) || 0),
          )[0]
        : null;

    const baseSummary =
      data.summary || {
        'Analyzed Files': files.length,
        'Total Vulnerabilities': totalVulnsFromData,
        'Average Security Score':
          avgSecurityScore != null ? avgSecurityScore.toFixed(2) : files.length > 0 ? '-' : 'N/A',
        'Average Overall Risk':
          avgRiskScore != null ? avgRiskScore.toFixed(2) : files.length > 0 ? '-' : 'N/A',
        'Most Risky File': highestRiskFile?.filePath ?? '-',
      };

    const summary = baseSummary || {};

    const severityColor = (severity: string) => {
      // Türkçe açıklama: Severity / riskLevel değerine göre renk belirliyoruz
      const s = severity?.toUpperCase?.() ?? '';
      if (s === 'CRITICAL') return 'bg-red-600 text-white';
      if (s === 'HIGH') return 'bg-red-500 text-white';
      if (s === 'MEDIUM') return 'bg-amber-500 text-white';
      if (s === 'LOW') return 'bg-emerald-500 text-white';
      return 'bg-muted text-foreground';
    };

    // Türkçe açıklama: Backend vulnerabilities alanını şöyle döndürüyor:
    // vulnerabilities: { VULN_TYPE: [ { type, description, riskLevel, lineNumber, ... } ] }
    // Burada bu haritayı flatten edip tek bir satır listesi oluşturuyoruz
    const flattenedVulnerabilities =
      files.flatMap((file: any) => {
        const vulsObj = file.vulnerabilities;
        if (!vulsObj || typeof vulsObj !== 'object') {
          return [];
        }

        return Object.entries(vulsObj).flatMap(([_, vulns]: [string, any]) => {
          const list = Array.isArray(vulns) ? vulns : vulns ? [vulns] : [];
          return list.map(v => ({
            filePath: file.filePath,
            lineNumber: v.lineNumber ?? v.line ?? null,
            message: v.description ?? v.message ?? '',
            severity: v.riskLevel ?? v.severity ?? 'UNKNOWN',
          }));
        });
      }) || [];

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(summary).map(([key, value]) => (
            <Card key={key} className="p-3">
              <div className="text-xs text-muted-foreground">{key}</div>
              <div className="text-lg font-semibold">{String(value)}</div>
            </Card>
          ))}
        </div>

        <div className="border rounded-md max-h-80 overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="text-left px-3 py-2">File</th>
                <th className="text-left px-3 py-2">Line</th>
                <th className="text-left px-3 py-2">Message</th>
                <th className="text-left px-3 py-2">Severity</th>
              </tr>
            </thead>
            <tbody>
              {flattenedVulnerabilities.map((vuln: any, idx: number) => (
                <tr key={`${vuln.filePath}-${idx}`} className="border-t align-top">
                  <td className="px-3 py-2 font-mono text-xs break-all">
                    {vuln.filePath}
                  </td>
                  <td className="px-3 py-2">{vuln.lineNumber ?? '-'}</td>
                  <td className="px-3 py-2">{vuln.message || '-'}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium ${severityColor(
                        vuln.severity,
                      )}`}
                    >
                      {vuln.severity ?? 'UNKNOWN'}
                    </span>
                  </td>
                </tr>
              ))}
              {flattenedVulnerabilities.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-4 text-center text-muted-foreground">
                    No security vulnerabilities found or data unavailable.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderCloneDetectionView = () => {
    // Türkçe açıklama: Clone detection için dosya çiftlerini similarity skoruna göre listeler
    const data = getParsedData('clone-detection');
    if (!data) {
      return <div className="text-sm text-red-500">Clone detection data is not valid JSON.</div>;
    }

    const duplicatePairs = Array.isArray(data.duplicatePairs) ? data.duplicatePairs : [];

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-3">
            <div className="text-xs text-muted-foreground">Total Files</div>
            <div className="text-lg font-semibold">{data.totalFiles ?? '-'}</div>
          </Card>
          <Card className="p-3">
            <div className="text-xs text-muted-foreground">Total Comparisons</div>
            <div className="text-lg font-semibold">{data.totalComparisons ?? '-'}</div>
          </Card>
          <Card className="p-3">
            <div className="text-xs text-muted-foreground">Duplicate Pairs</div>
            <div className="text-lg font-semibold">{duplicatePairs.length}</div>
          </Card>
          <Card className="p-3">
            <div className="text-xs text-muted-foreground">Average Similarity</div>
            <div className="text-lg font-semibold">
              {data.averageSimilarity != null ? `${data.averageSimilarity.toFixed?.(1) ?? data.averageSimilarity}` : '-'}
            </div>
          </Card>
        </div>

        <div className="border rounded-md max-h-80 overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="text-left px-3 py-2">File 1</th>
                <th className="text-left px-3 py-2">File 2</th>
                <th className="text-right px-3 py-2">Similarity</th>
                <th className="text-left px-3 py-2">Duplicated Lines</th>
              </tr>
            </thead>
            <tbody>
              {duplicatePairs.map((pair: any, idx: number) => (
                <tr key={idx} className="border-t align-top">
                  <td className="px-3 py-2 font-mono text-xs break-all">{pair.file1}</td>
                  <td className="px-3 py-2 font-mono text-xs break-all">{pair.file2}</td>
                  <td className="px-3 py-2 text-right">
                    {pair.similarity != null ? `${Number(pair.similarity).toFixed(1)}%` : '-'}
                  </td>
                  <td className="px-3 py-2">
                    {Array.isArray(pair.duplicatedLines) && pair.duplicatedLines.length > 0 ? (
                      <div className="flex flex-wrap gap-1 max-w-md">
                        {pair.duplicatedLines.slice(0, 10).map((r: string, i: number) => (
                          <span
                            key={i}
                            className="inline-flex items-center rounded bg-muted px-2 py-0.5 text-[11px] font-mono"
                            title={r}
                          >
                            {r.length > 30 ? r.substring(0, 30) + '...' : r}
                          </span>
                        ))}
                        {pair.duplicatedLines.length > 10 && (
                          <button
                            onClick={() => {
                              setSelectedDuplicatedLines(pair.duplicatedLines);
                              setSelectedPairInfo({ file1: pair.file1, file2: pair.file2 });
                              setDuplicatedLinesDialogOpen(true);
                            }}
                            className="inline-flex items-center rounded bg-muted px-2 py-0.5 text-[11px] text-muted-foreground hover:bg-muted/80 cursor-pointer transition-colors"
                          >
                            +{pair.duplicatedLines.length - 10} more
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-xs">No details</span>
                    )}
                  </td>
                </tr>
              ))}
              {duplicatePairs.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-4 text-center text-muted-foreground">
                    No duplicate code pairs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Duplicated Lines Dialog */}
        <Dialog open={duplicatedLinesDialogOpen} onOpenChange={setDuplicatedLinesDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Duplicated Lines</DialogTitle>
              {selectedPairInfo && (
                <div className="text-sm text-muted-foreground space-y-1">
                  <div><span className="font-medium">File 1:</span> <span className="font-mono text-xs">{selectedPairInfo.file1}</span></div>
                  <div><span className="font-medium">File 2:</span> <span className="font-mono text-xs">{selectedPairInfo.file2}</span></div>
                </div>
              )}
            </DialogHeader>
            <div className="space-y-2 mt-4">
              {selectedDuplicatedLines.map((line: string, idx: number) => (
                <div
                  key={idx}
                  className="p-2 rounded bg-muted font-mono text-xs break-all border"
                >
                  {line}
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button onClick={() => setDuplicatedLinesDialogOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  };

  const renderCodeGraphView = () => {
    // Türkçe açıklama: Code graph sonucunu dosya bazlı complexity ve detay kartları ile sunar
    const data = getParsedData('code-graph');
    if (!data) {
      return <div className="text-sm text-red-500">Code graph data is not valid JSON.</div>;
    }

    const files = Array.isArray(data.files) ? data.files : [];

    // Türkçe açıklama: Proje geneli graph özeti (total files, average complexity, en karmaşık dosya)
    const totalFiles = data.totalFiles ?? files.length;
    const complexities = files
      .map((f: any) => Number(f.complexity))
      .filter(v => !Number.isNaN(v));
    const avgComplexity =
      complexities.length > 0
        ? complexities.reduce((a, b) => a + b, 0) / complexities.length
        : null;
    const mostComplexFile =
      files.length > 0
        ? [...files].sort(
            (a: any, b: any) => (Number(b.complexity ?? 0) || 0) - (Number(a.complexity ?? 0) || 0),
          )[0]
        : null;

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-3">
            <div className="text-xs text-muted-foreground">Total Files</div>
            <div className="text-lg font-semibold">{totalFiles}</div>
          </Card>
          <Card className="p-3">
            <div className="text-xs text-muted-foreground">Average Complexity</div>
            <div className="text-lg font-semibold">
              {avgComplexity != null ? avgComplexity.toFixed(2) : files.length > 0 ? '-' : 'N/A'}
            </div>
          </Card>
          <Card className="p-3 col-span-2">
            <div className="text-xs text-muted-foreground">Most Complex File</div>
            <div className="text-xs font-mono break-all">
              {mostComplexFile?.filePath ?? '-'}
            </div>
            {mostComplexFile?.complexity != null && (
              <div className="text-xs text-muted-foreground mt-1">
                Complexity:{' '}
                <span className="font-semibold">
                  {Number(mostComplexFile.complexity).toFixed(2)}
                </span>
              </div>
            )}
          </Card>
        </div>

        <div className="border rounded-md max-h-80 overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="text-left px-3 py-2">File</th>
                <th className="text-right px-3 py-2">Complexity</th>
                <th className="text-left px-3 py-2">Details</th>
              </tr>
            </thead>
            <tbody>
              {files.map((file: any, idx: number) => (
                <tr key={idx} className="border-t align-top">
                  <td className="px-3 py-2 font-mono text-xs break-all">{file.filePath}</td>
                  <td className="px-3 py-2 text-right">{file.complexity ?? '-'}</td>
                  <td className="px-3 py-2">
                    {Array.isArray(file.complexityDetails) && file.complexityDetails.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {file.complexityDetails.slice(0, 3).map((detail: string, i: number) => (
                          <span
                            key={i}
                            className="inline-flex items-center rounded bg-muted px-2 py-0.5 text-[11px]"
                          >
                            {detail}
                          </span>
                        ))}
                        {file.complexityDetails.length > 3 && (
                          <span className="text-[11px] text-muted-foreground">
                            +{file.complexityDetails.length - 3} more
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">No complexity details</span>
                    )}
                  </td>
                </tr>
              ))}
              {files.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-3 py-4 text-center text-muted-foreground">
                    No code graph data available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderProjectGraphView = () => {
    if (projectGraphLoading) {
      return (
        <div className="text-sm text-muted-foreground text-center py-4">
          Loading project code graph...
        </div>
      );
    }

    if (projectGraphError) {
      return (
        <div className="text-sm text-red-500 py-4">
          {projectGraphError}
        </div>
      );
    }

    if (!projectGraph) {
      return (
        <div className="text-sm text-muted-foreground py-4">
          Project code graph has not been loaded yet.
        </div>
      );
    }

    const classCount = projectGraph.vertices.filter(v => v.type === 'class').length;
    const methodCount = projectGraph.vertices.filter(v => v.type === 'method').length;

    const topClasses = projectGraph.vertices
      .filter(v => v.type === 'class')
      .slice(0, 10);

    // Connectivity Number yorumlama fonksiyonu
    const getConnectivityInterpretation = (value: number | undefined): { 
      label: string, 
      color: string, 
      description: string 
    } => {
      if (value === undefined || value < 0) {
        return { 
          label: 'Hesaplanmadı', 
          color: 'text-muted-foreground',
          description: 'Connectivity number henüz hesaplanmadı.'
        };
      }
      if (value === 0) {
        return { 
          label: 'Bağlantısız', 
          color: 'text-red-500',
          description: 'Graf zaten bağlantısız durumda (kenar yok veya izole node\'lar var).'
        };
      }
      if (value === 1) {
        return { 
          label: 'Zayıf', 
          color: 'text-orange-500',
          description: 'Tek bir node\'un çıkarılması grafiği bağlantısız yapabilir. Yüksek bağımlılık riski.'
        };
      }
      if (value <= 3) {
        return { 
          label: 'Orta', 
          color: 'text-yellow-500',
          description: `${value} node'un çıkarılması grafiği bağlantısız yapabilir. Orta düzey dayanıklılık.`
        };
      }
      return { 
        label: 'Güçlü', 
        color: 'text-green-500',
        description: `Grafiği bağlantısız yapmak için ${value} node'un çıkarılması gerekiyor. İyi yapısal dayanıklılık.`
      };
    };

    const connectivityInfo = getConnectivityInterpretation(projectGraph.metrics.connectivityNumber);

    // Scattering Number yorumlama fonksiyonu
    const getScatteringInterpretation = (value: number | undefined): { 
      label: string, 
      color: string, 
      description: string 
    } => {
      if (value === undefined || value < 0) {
        return { 
          label: 'Hesaplanmadı', 
          color: 'text-muted-foreground',
          description: 'Scattering number henüz hesaplanmadı.'
        };
      }
      if (value === 0) {
        return { 
          label: 'Stabil', 
          color: 'text-green-500',
          description: 'Graf parçalanmaya karşı dayanıklı. Node kaybı fazla parça oluşturmuyor. Yapısal bütünlük korunuyor.'
        };
      }
      if (value > 0 && value <= 2) {
        return { 
          label: 'Orta', 
          color: 'text-yellow-500',
          description: `Az sayıda node çıkarıldığında en fazla ${value.toFixed(1)} parça oluşabilir. Orta düzey kırılganlık, dikkatli olunmalı.`
        };
      }
      return { 
        label: 'Kırılgan', 
        color: 'text-red-500',
        description: `Az sayıda node çıkarıldığında en fazla ${value.toFixed(1)} parça oluşabilir. Yüksek kırılganlık riski, yapısal iyileştirme önerilir.`
      };
    };

    const scatteringInfo = getScatteringInterpretation(projectGraph.metrics.scatteringNumber);

    // Rupture Number yorumlama fonksiyonu
    const getRuptureInterpretation = (value: number | undefined): { 
      label: string, 
      color: string, 
      description: string 
    } => {
      if (value === undefined || value < 0) {
        return { 
          label: 'Hesaplanmadı', 
          color: 'text-muted-foreground',
          description: 'Rupture number henüz hesaplanmadı.'
        };
      }
      if (value === 0) {
        return { 
          label: 'Stabil', 
          color: 'text-green-500',
          description: 'Graf parçalanmaya karşı dayanıklı. En büyük parça küçük kalıyor.'
        };
      }
      if (value > 0 && value <= 2) {
        return { 
          label: 'Orta', 
          color: 'text-yellow-500',
          description: `Az sayıda node çıkarıldığında ${value.toFixed(1)} rupture değeri oluşabilir. Orta düzey kırılganlık.`
        };
      }
      return { 
        label: 'Kırılgan', 
        color: 'text-red-500',
        description: `Az sayıda node çıkarıldığında ${value.toFixed(1)} rupture değeri oluşabilir. Yüksek kırılganlık, büyük parça oluşuyor.`
      };
    };

    const ruptureInfo = getRuptureInterpretation(projectGraph.metrics.ruptureNumber);

    // Integrity Number yorumlama fonksiyonu
    const getIntegrityInterpretation = (value: number | undefined): { 
      label: string, 
      color: string, 
      description: string 
    } => {
      if (value === undefined || value < 0) {
        return { 
          label: 'Hesaplanmadı', 
          color: 'text-muted-foreground',
          description: 'Integrity number henüz hesaplanmadı.'
        };
      }
      if (value <= 2) {
        return { 
          label: 'Yüksek Bütünlük', 
          color: 'text-green-500',
          description: 'Graf yapısal olarak sağlam. Az node kaybıyla küçük parçalara bölünebilir.'
        };
      }
      if (value > 2 && value <= 5) {
        return { 
          label: 'Orta Bütünlük', 
          color: 'text-yellow-500',
          description: `Graf orta düzeyde bütünlüğe sahip. ${value.toFixed(1)} integrity değeri, bazı node kayıplarında büyük parçalar oluşabileceğini gösterir.`
        };
      }
      return { 
        label: 'Düşük Bütünlük', 
        color: 'text-red-500',
        description: `Graf yapısal olarak zayıf. ${value.toFixed(1)} integrity değeri, node kayıplarında büyük parçalar oluşabileceğini gösterir.`
      };
    };

    const integrityInfo = getIntegrityInterpretation(projectGraph.metrics.integrityNumber);

    // Toughness Number yorumlama fonksiyonu
    const getToughnessInterpretation = (value: number | undefined): { 
      label: string, 
      color: string, 
      description: string 
    } => {
      if (value === undefined || value < 0) {
        return { 
          label: 'Hesaplanmadı', 
          color: 'text-muted-foreground',
          description: 'Toughness number henüz hesaplanmadı.'
        };
      }
      if (value === Number.POSITIVE_INFINITY || !isFinite(value)) {
        return { 
          label: 'Parçalanamaz', 
          color: 'text-green-500',
          description: 'Graf çok dayanıklı. Parçalanamaz veya parçalanması çok zor.'
        };
      }
      if (value <= 0.5) {
        return { 
          label: 'Çok Kırılgan', 
          color: 'text-red-500',
          description: `Graf çok kırılgan. ${value.toFixed(2)} toughness değeri, az node kaybında çok fazla parça oluşabileceğini gösterir.`
        };
      }
      if (value > 0.5 && value <= 1.0) {
        return { 
          label: 'Kırılgan', 
          color: 'text-orange-500',
          description: `Graf kırılgan. ${value.toFixed(2)} toughness değeri, node kayıplarında birkaç parça oluşabileceğini gösterir.`
        };
      }
      if (value > 1.0 && value <= 2.0) {
        return { 
          label: 'Orta Dayanıklılık', 
          color: 'text-yellow-500',
          description: `Graf orta düzeyde dayanıklı. ${value.toFixed(2)} toughness değeri, bazı node kayıplarında parçalanabileceğini gösterir.`
        };
      }
      return { 
        label: 'Dayanıklı', 
        color: 'text-green-500',
        description: `Graf dayanıklı. ${value.toFixed(2)} toughness değeri, parçalanması için çok sayıda node kaybı gerektiğini gösterir.`
      };
    };

    const toughnessInfo = getToughnessInterpretation(projectGraph.metrics.toughnessNumber);

    // Domination Number yorumlama fonksiyonu
    const getDominationInterpretation = (value: number | undefined, totalNodes: number): { 
      label: string, 
      color: string, 
      description: string 
    } => {
      if (value === undefined || value < 0) {
        return { 
          label: 'Hesaplanmadı', 
          color: 'text-muted-foreground',
          description: 'Domination number henüz hesaplanmadı.'
        };
      }
      if (value === 1) {
        return { 
          label: 'Mükemmel', 
          color: 'text-green-500',
          description: 'Tek bir node tüm grafı kontrol edebilir. Çok merkezi bir yapı.'
        };
      }
      const ratio = value / totalNodes;
      if (ratio <= 0.2) {
        return { 
          label: 'Çok İyi', 
          color: 'text-green-500',
          description: `Sadece ${value} node ile tüm graf kontrol edilebilir. Grafın %${(ratio * 100).toFixed(0)}'si yeterli.`
        };
      }
      if (ratio > 0.2 && ratio <= 0.4) {
        return { 
          label: 'İyi', 
          color: 'text-blue-500',
          description: `${value} node ile tüm graf kontrol edilebilir. Grafın %${(ratio * 100).toFixed(0)}'si yeterli.`
        };
      }
      if (ratio > 0.4 && ratio <= 0.6) {
        return { 
          label: 'Orta', 
          color: 'text-yellow-500',
          description: `${value} node ile tüm graf kontrol edilebilir. Grafın %${(ratio * 100).toFixed(0)}'si gerekli.`
        };
      }
      return { 
        label: 'Zayıf', 
        color: 'text-orange-500',
        description: `${value} node ile tüm graf kontrol edilebilir. Grafın %${(ratio * 100).toFixed(0)}'si gerekli. Merkezi yapı zayıf.`
      };
    };

    const dominationInfo = getDominationInterpretation(
      projectGraph.metrics.dominationNumber, 
      projectGraph.metrics.totalNodes
    );

    // 2-Vertex Cover Number yorumlama fonksiyonu
    const getTwoVertexCoverInterpretation = (value: number | undefined, totalNodes: number): { 
      label: string, 
      color: string, 
      description: string 
    } => {
      if (value === undefined || value < 0) {
        return { 
          label: 'Hesaplanmadı', 
          color: 'text-muted-foreground',
          description: '2-Vertex Cover henüz hesaplanmadı.'
        };
      }
      if (value === 1) {
        return { 
          label: 'Mükemmel', 
          color: 'text-green-500',
          description: 'Tek bir node hem tüm edge\'leri kapsar hem de yedeklilik sağlar. Çok merkezi yapı.'
        };
      }
      const ratio = value / totalNodes;
      if (ratio <= 0.2) {
        return { 
          label: 'Çok İyi', 
          color: 'text-green-500',
          description: `Sadece ${value} node ile hem edge kapsama hem de yedeklilik sağlanıyor. Grafın %${(ratio * 100).toFixed(0)}'si yeterli.`
        };
      }
      if (ratio > 0.2 && ratio <= 0.4) {
        return { 
          label: 'İyi', 
          color: 'text-blue-500',
          description: `${value} node ile hem edge kapsama hem de yedeklilik sağlanıyor. Grafın %${(ratio * 100).toFixed(0)}'si yeterli.`
        };
      }
      if (ratio > 0.4 && ratio <= 0.6) {
        return { 
          label: 'Orta', 
          color: 'text-yellow-500',
          description: `${value} node ile hem edge kapsama hem de yedeklilik sağlanıyor. Grafın %${(ratio * 100).toFixed(0)}'si gerekli.`
        };
      }
      return { 
        label: 'Zayıf', 
        color: 'text-orange-500',
        description: `${value} node ile hem edge kapsama hem de yedeklilik sağlanıyor. Grafın %${(ratio * 100).toFixed(0)}'si gerekli. Merkezi yapı zayıf.`
      };
    };

    const twoVertexCoverInfo = getTwoVertexCoverInterpretation(
      projectGraph.metrics.twoVertexCoverNumber, 
      projectGraph.metrics.totalNodes
    );

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <Card className="p-3">
            <div className="text-xs text-muted-foreground">Total Nodes</div>
            <div className="text-lg font-semibold">{projectGraph.metrics.totalNodes}</div>
          </Card>
          <Card className="p-3">
            <div className="text-xs text-muted-foreground">Total Edges</div>
            <div className="text-lg font-semibold">{projectGraph.metrics.totalEdges}</div>
          </Card>
          <Card className="p-3">
            <div className="text-xs text-muted-foreground">Avg Degree</div>
            <div className="text-lg font-semibold">
              {projectGraph.metrics.avgDegree.toFixed(2)}
            </div>
          </Card>
          <Card className="p-3">
            <div className="text-xs text-muted-foreground">Max Degree</div>
            <div className="text-lg font-semibold">{projectGraph.metrics.maxDegree}</div>
          </Card>
          <Card className="p-3">
            <div className="text-xs text-muted-foreground">Connectivity Number</div>
            <div className="text-lg font-semibold">
              {projectGraph.metrics.connectivityNumber !== undefined && 
               projectGraph.metrics.connectivityNumber >= 0 
                ? projectGraph.metrics.connectivityNumber 
                : 'N/A'}
            </div>
          </Card>
          <Card className="p-3">
            <div className="text-xs text-muted-foreground">Scattering Number</div>
            <div className="text-lg font-semibold">
              {projectGraph.metrics.scatteringNumber !== undefined && 
               projectGraph.metrics.scatteringNumber >= 0 
                ? projectGraph.metrics.scatteringNumber.toFixed(2)
                : 'N/A'}
            </div>
          </Card>
          <Card className="p-3">
            <div className="text-xs text-muted-foreground">Rupture Number</div>
            <div className="text-lg font-semibold">
              {projectGraph.metrics.ruptureNumber !== undefined && 
               projectGraph.metrics.ruptureNumber >= 0 
                ? projectGraph.metrics.ruptureNumber.toFixed(2)
                : projectGraph.metrics.ruptureNumber === -1.0
                ? 'N/A'
                : 'N/A'}
            </div>
          </Card>
          <Card className="p-3">
            <div className="text-xs text-muted-foreground">Integrity Number</div>
            <div className="text-lg font-semibold">
              {projectGraph.metrics.integrityNumber !== undefined && 
               projectGraph.metrics.integrityNumber >= 0 
                ? projectGraph.metrics.integrityNumber.toFixed(2)
                : 'N/A'}
            </div>
          </Card>
          <Card className="p-3">
            <div className="text-xs text-muted-foreground">Toughness Number</div>
            <div className="text-lg font-semibold">
              {projectGraph.metrics.toughnessNumber !== undefined && 
               projectGraph.metrics.toughnessNumber >= 0 && 
               isFinite(projectGraph.metrics.toughnessNumber)
                ? projectGraph.metrics.toughnessNumber.toFixed(2)
                : projectGraph.metrics.toughnessNumber !== undefined && 
                  (!isFinite(projectGraph.metrics.toughnessNumber) || 
                   projectGraph.metrics.toughnessNumber === Number.POSITIVE_INFINITY)
                ? '∞'
                : 'N/A'}
            </div>
          </Card>
          <Card className="p-3">
            <div className="text-xs text-muted-foreground">Domination Number</div>
            <div className="text-lg font-semibold">
              {projectGraph.metrics.dominationNumber !== undefined && 
               projectGraph.metrics.dominationNumber >= 0 
                ? projectGraph.metrics.dominationNumber
                : 'N/A'}
            </div>
          </Card>
          <Card className="p-3">
            <div className="text-xs text-muted-foreground">2-Vertex Cover</div>
            <div className="text-lg font-semibold">
              {projectGraph.metrics.twoVertexCoverNumber !== undefined && 
               projectGraph.metrics.twoVertexCoverNumber >= 0 
                ? projectGraph.metrics.twoVertexCoverNumber
                : 'N/A'}
            </div>
          </Card>
          <Card className="p-3">
            <div className="text-xs text-muted-foreground">Degree Distribution</div>
            <div className="text-lg font-semibold">
              {projectGraph.metrics.degreeDistribution && 
               Object.keys(projectGraph.metrics.degreeDistribution).length > 0
                ? `${Object.keys(projectGraph.metrics.degreeDistribution).length} levels`
                : 'N/A'}
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          <Card className="p-3">
            <div className="text-xs text-muted-foreground mb-1">Classes</div>
            <div className="text-lg font-semibold">{classCount}</div>
          </Card>
          <Card className="p-3">
            <div className="text-xs text-muted-foreground mb-1">Methods</div>
            <div className="text-lg font-semibold">{methodCount}</div>
          </Card>
        </div>

        {/* Graph Visualization */}
        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Code Graph Visualization</h3>
            <div className="flex items-center gap-4">
              <div className="flex gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#8E44AD' }}></div>
                  <span>Classes</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#27AE60' }}></div>
                  <span>Methods</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-1 rounded" style={{ backgroundColor: '#F39C12' }}></div>
                  <span>Dependencies</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-1 rounded" style={{ backgroundColor: '#3498DB' }}></div>
                  <span>Method Calls</span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (graphRef.current) {
                    // Reset zoom ve pan
                    graphRef.current.zoom(1);
                    graphRef.current.centerAt(0, 0, 1000);
                    // Sonra tüm node'ları görünür yap
                    setTimeout(() => {
                      graphRef.current?.zoomToFit(400, 20);
                    }, 100);
                  }
                }}
              >
                Reset View
              </Button>
            </div>
          </div>
          <div 
            ref={graphContainerRef}
            className="border rounded-md bg-background overflow-hidden" 
            style={{ height: '600px', position: 'relative' }}
          >
            <ForceGraph2D
              ref={graphRef}
              graphData={graphData}
              width={graphDimensions.width}
              height={graphDimensions.height}
              nodeLabel={(node: any) => `${node.label} (${node.type})`}
              nodeColor={(node: any) => node.color}
              nodeVal={(node: any) => node.size}
              linkColor={(link: any) => link.color}
              linkWidth={(link: any) => link.width}
              linkDistance={(link: any) => {
                // Link mesafesi - edge tipine göre ayarla
                if (link.type === 'depends') return 100; // Sınıf bağımlılıkları daha uzun
                if (link.type === 'calls') return 60; // Metot çağrıları orta mesafe
                return 50; // has (sınıf-metot ilişkisi) en yakın
              }}
              linkDirectionalArrowLength={3}
              linkDirectionalArrowRelPos={1}
              // Charge kuvvetini kaldır - node'lar birbirini itmesin, sadece link mesafesi kullan
              d3Force="charge"
              d3ForceStrength={0}
              // Center force - node'ları merkeze topla (otomatik eklenir, strength ayarlanabilir)
              d3AlphaDecay={0.0228}
              d3VelocityDecay={0.4}
              cooldownTime={15000}
              enableZoomInteraction={true}
              enablePanInteraction={true}
              enableNodeDrag={true}
              onNodeDrag={(node: any) => {
                // Node'un yarıçapını hesaba kat (size en büyük 8, yarıçap 4)
                const nodeRadius = (node.size || 8) / 2;
                const padding = nodeRadius + 10; // Node yarıçapı + ekstra padding
                const maxX = graphDimensions.width / 2 - padding;
                const maxY = graphDimensions.height / 2 - padding;
                const minX = -graphDimensions.width / 2 + padding;
                const minY = -graphDimensions.height / 2 + padding;
                
                if (node.x > maxX) node.x = maxX;
                if (node.x < minX) node.x = minX;
                if (node.y > maxY) node.y = maxY;
                if (node.y < minY) node.y = minY;
              }}
              onNodeDragEnd={(node: any) => {
                // Node sürükleme bittiğinde fixed pozisyonu kaldır
                node.fx = null;
                node.fy = null;
              }}
              onNodeClick={(node: any) => {
                console.log('Clicked node:', node);
              }}
              onLinkClick={(link: any) => {
                console.log('Clicked link:', link);
              }}
              nodeCanvasObject={(node: any, ctx: any, globalScale: number) => {
                // Sadece yeterince yakınlaştırıldığında etiketleri göster
                if (globalScale < 1.4) return;

                const label = node.type === 'method' 
                  ? node.label.split('.').pop() || node.label 
                  : node.label;
                const fontSize = 12/globalScale;
                ctx.font = `${fontSize}px Sans-Serif`;
                const textWidth = ctx.measureText(label).width;
                const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2);

                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.fillRect(
                  node.x - bckgDimensions[0] / 2,
                  node.y - bckgDimensions[1] / 2,
                  bckgDimensions[0],
                  bckgDimensions[1]
                );

                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = node.color;
                ctx.fillText(label, node.x, node.y);
              }}
              nodeCanvasObjectMode={() => 'after'}
              onEngineTick={() => {
                // Container'ın gerçek boyutlarını kullan ve node'ları sınırlar içinde tut
                // Her node'un kendi yarıçapını hesaba kat
                graphData.nodes.forEach((node: any) => {
                  const nodeRadius = (node.size || 8) / 2;
                  const padding = nodeRadius + 10; // Node yarıçapı + ekstra padding
                  const maxX = graphDimensions.width / 2 - padding;
                  const maxY = graphDimensions.height / 2 - padding;
                  const minX = -graphDimensions.width / 2 + padding;
                  const minY = -graphDimensions.height / 2 + padding;
                  
                  if (node.x > maxX) node.x = maxX;
                  if (node.x < minX) node.x = minX;
                  if (node.y > maxY) node.y = maxY;
                  if (node.y < minY) node.y = minY;
                });
              }}
              onEngineStop={() => {
                // Graph simülasyonu bittiğinde otomatik olarak merkeze topla
                if (graphRef.current && graphData.nodes.length > 0) {
                  setTimeout(() => {
                    graphRef.current?.zoomToFit(400, 20);
                  }, 100);
                }
              }}
            />
          </div>
        </Card>

        {/* Connectivity Number Panel */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-4">Connectivity Number (κ(G))</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="text-4xl font-bold">
                {projectGraph.metrics.connectivityNumber !== undefined && 
                 projectGraph.metrics.connectivityNumber >= 0 
                  ? projectGraph.metrics.connectivityNumber 
                  : 'N/A'}
              </div>
              <Badge 
                variant="outline" 
                className={`${connectivityInfo.color} border-current`}
              >
                {connectivityInfo.label}
              </Badge>
              {projectGraph.metrics.connectivityCalculationMethod && (
                <Badge 
                  variant="secondary" 
                  className={projectGraph.metrics.connectivityCalculationMethod === 'EXACT' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'}
                >
                  {projectGraph.metrics.connectivityCalculationMethod === 'EXACT' ? '🟢 Exact' : '🟡 Heuristic'}
                </Badge>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              {connectivityInfo.description}
            </div>
            <div className="text-xs text-muted-foreground pt-2 border-t">
              Connectivity Number, grafiği bağlantısız yapmak için çıkarılması gereken minimum node sayısını gösterir. 
              Düşük değer (0-1) zayıf yapı, yüksek değer (4+) güçlü yapı anlamına gelir.
            </div>
          </div>
        </Card>

        {/* Scattering Number Panel */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-4">Scattering Number (s(G))</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="text-4xl font-bold">
                {projectGraph.metrics.scatteringNumber !== undefined && 
                 projectGraph.metrics.scatteringNumber >= 0 
                  ? projectGraph.metrics.scatteringNumber.toFixed(2)
                  : 'N/A'}
              </div>
              <Badge 
                variant="outline" 
                className={`${scatteringInfo.color} border-current`}
              >
                {scatteringInfo.label}
              </Badge>
              {projectGraph.metrics.scatteringCalculationMethod && (
                <Badge 
                  variant="secondary" 
                  className={projectGraph.metrics.scatteringCalculationMethod === 'EXACT' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'}
                >
                  {projectGraph.metrics.scatteringCalculationMethod === 'EXACT' ? '🟢 Exact' : '🟡 Heuristic'}
                </Badge>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              {scatteringInfo.description}
            </div>
            <div className="text-xs text-muted-foreground pt-2 border-t">
              Scattering Number (s(G)), grafin en çok ne kadar parçalanabileceğini ölçen bir metriktir. 
              Bu değer, az sayıda node çıkarıldığında oluşabilecek maksimum parça sayısını gösterir.
              <div className="mt-2 space-y-1">
                <div><strong>Düşük değer (0):</strong> Graf parçalanmaya karşı dayanıklı, node kaybı fazla parça oluşturmuyor</div>
                <div><strong>Orta değer (1-2):</strong> Az sayıda node kaybında birkaç parça oluşabilir, orta düzey kırılganlık</div>
                <div><strong>Yüksek değer (3+):</strong> Az sayıda node kaybında çok fazla parça oluşabilir, yüksek kırılganlık riski</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Rupture Number Panel */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-4">Rupture Number (r(G))</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="text-4xl font-bold">
                {projectGraph.metrics.ruptureNumber !== undefined && 
                 projectGraph.metrics.ruptureNumber >= 0 
                  ? projectGraph.metrics.ruptureNumber.toFixed(2)
                  : 'N/A'}
              </div>
              <Badge 
                variant="outline" 
                className={`${ruptureInfo.color} border-current`}
              >
                {ruptureInfo.label}
              </Badge>
              {projectGraph.metrics.ruptureCalculationMethod && (
                <Badge 
                  variant="secondary" 
                  className={projectGraph.metrics.ruptureCalculationMethod === 'EXACT' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'}
                >
                  {projectGraph.metrics.ruptureCalculationMethod === 'EXACT' ? '🟢 Exact' : '🟡 Heuristic'}
                </Badge>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              {ruptureInfo.description}
            </div>
            <div className="text-xs text-muted-foreground pt-2 border-t">
              Rupture Number (r(G)), grafin en çok ne kadar parçalanabileceğini ölçen bir metriktir.
              Scattering'den farklı olarak, en büyük parçanın boyutunu da hesaba katar.
              <div className="mt-2 space-y-1">
                <div><strong>Düşük değer (0):</strong> Graf parçalanmaya karşı dayanıklı, en büyük parça küçük kalıyor</div>
                <div><strong>Orta değer (1-2):</strong> Az sayıda node kaybında birkaç parça oluşabilir, orta düzey kırılganlık</div>
                <div><strong>Yüksek değer (3+):</strong> Az sayıda node kaybında çok fazla parça ve büyük bir parça oluşabilir, yüksek kırılganlık</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Integrity Number Panel */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-4">Integrity Number (I(G))</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="text-4xl font-bold">
                {projectGraph.metrics.integrityNumber !== undefined && 
                 projectGraph.metrics.integrityNumber >= 0 
                  ? projectGraph.metrics.integrityNumber.toFixed(2)
                  : 'N/A'}
              </div>
              <Badge 
                variant="outline" 
                className={`${integrityInfo.color} border-current`}
              >
                {integrityInfo.label}
              </Badge>
              {projectGraph.metrics.integrityCalculationMethod && (
                <Badge 
                  variant="secondary" 
                  className={projectGraph.metrics.integrityCalculationMethod === 'EXACT' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'}
                >
                  {projectGraph.metrics.integrityCalculationMethod === 'EXACT' ? '🟢 Exact' : '🟡 Heuristic'}
                </Badge>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              {integrityInfo.description}
            </div>
            <div className="text-xs text-muted-foreground pt-2 border-t">
              Integrity Number (I(G)), grafı bozmak için silinen node sayısı ile kalan en büyük parçanın boyutunu toplayarak minimum değeri bulur.
              Bu metrik, grafin yapısal bütünlüğünü ölçer.
              <div className="mt-2 space-y-1">
                <div><strong>Düşük değer (≤2):</strong> Graf yapısal olarak sağlam, az node kaybıyla küçük parçalara bölünebilir</div>
                <div><strong>Orta değer (3-5):</strong> Graf orta düzeyde bütünlüğe sahip, bazı node kayıplarında büyük parçalar oluşabilir</div>
                <div><strong>Yüksek değer (6+):</strong> Graf yapısal olarak zayıf, node kayıplarında büyük parçalar oluşabilir</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Toughness Number Panel */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-4">Toughness Number (τ(G))</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="text-4xl font-bold">
                {projectGraph.metrics.toughnessNumber !== undefined && 
                 projectGraph.metrics.toughnessNumber >= 0 && 
                 isFinite(projectGraph.metrics.toughnessNumber)
                  ? projectGraph.metrics.toughnessNumber.toFixed(2)
                  : projectGraph.metrics.toughnessNumber !== undefined && 
                    (!isFinite(projectGraph.metrics.toughnessNumber) || 
                     projectGraph.metrics.toughnessNumber === Number.POSITIVE_INFINITY)
                  ? '∞'
                  : 'N/A'}
              </div>
              <Badge 
                variant="outline" 
                className={`${toughnessInfo.color} border-current`}
              >
                {toughnessInfo.label}
              </Badge>
              {projectGraph.metrics.toughnessCalculationMethod && (
                <Badge 
                  variant="secondary" 
                  className={projectGraph.metrics.toughnessCalculationMethod === 'EXACT' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'}
                >
                  {projectGraph.metrics.toughnessCalculationMethod === 'EXACT' ? '🟢 Exact' : '🟡 Heuristic'}
                </Badge>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              {toughnessInfo.description}
            </div>
            <div className="text-xs text-muted-foreground pt-2 border-t">
              Toughness Number (τ(G)), grafı parçalamak için gereken "bir parça başına düşen düğüm maliyeti"ni ölçer.
              Bu metrik, grafin parçalanmaya karşı dayanıklılığını gösterir.
              <div className="mt-2 space-y-1">
                <div><strong>Düşük değer (≤0.5):</strong> Graf çok kırılgan, az node kaybında çok fazla parça oluşur</div>
                <div><strong>Orta değer (0.5-2.0):</strong> Graf orta düzeyde dayanıklı, bazı node kayıplarında parçalanabilir</div>
                <div><strong>Yüksek değer (2.0+):</strong> Graf dayanıklı, parçalanması için çok sayıda node kaybı gerekir</div>
                <div><strong>∞ (Sonsuz):</strong> Graf parçalanamaz veya parçalanması çok zor</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Domination Number Panel */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-4">Domination Number (γ(G))</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="text-4xl font-bold">
                {projectGraph.metrics.dominationNumber !== undefined && 
                 projectGraph.metrics.dominationNumber >= 0 
                  ? projectGraph.metrics.dominationNumber
                  : 'N/A'}
              </div>
              <Badge 
                variant="outline" 
                className={`${dominationInfo.color} border-current`}
              >
                {dominationInfo.label}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              {dominationInfo.description}
            </div>
            <div className="text-xs text-muted-foreground pt-2 border-t">
              Domination Number (γ(G)), grafı kontrol etmek için en az kaç node seçmem gerektiğini ölçer.
              Bu metrik, grafin kontrol edilebilirliğini gösterir. Diğer metriklerden farklı olarak node silmez, node seçer.
              <div className="mt-2 space-y-1">
                <div><strong>Düşük değer (1-2):</strong> Çok az node ile tüm graf kontrol edilebilir, merkezi yapı güçlü</div>
                <div><strong>Orta değer (3-5):</strong> Birkaç node ile tüm graf kontrol edilebilir</div>
                <div><strong>Yüksek değer (6+):</strong> Çok sayıda node gerekir, merkezi yapı zayıf</div>
                <div><strong>Node sayısına eşit:</strong> Her node ayrı kontrol edilmeli, hiç bağlantı yok veya çok zayıf yapı</div>
              </div>
            </div>
          </div>
        </Card>

        {/* 2-Vertex Cover Number Panel */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-4">2-Vertex Cover Number (β₂(G))</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="text-4xl font-bold">
                {projectGraph.metrics.twoVertexCoverNumber !== undefined && 
                 projectGraph.metrics.twoVertexCoverNumber >= 0 
                  ? projectGraph.metrics.twoVertexCoverNumber
                  : 'N/A'}
              </div>
              <Badge 
                variant="outline" 
                className={`${twoVertexCoverInfo.color} border-current`}
              >
                {twoVertexCoverInfo.label}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              {twoVertexCoverInfo.description}
            </div>
            
            {/* Seçilen Node'ların Listesi */}
            {projectGraph.metrics.twoVertexCoverNodes && 
             projectGraph.metrics.twoVertexCoverNodes.length > 0 && (
              <div className="pt-2 border-t">
                <div className="text-xs font-semibold text-muted-foreground mb-2">
                  Seçilen Node'lar ({projectGraph.metrics.twoVertexCoverNodes.length}):
                </div>
                <div className="flex flex-wrap gap-2">
                  {projectGraph.metrics.twoVertexCoverNodes.map((node, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {node}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            <div className="text-xs text-muted-foreground pt-2 border-t">
              2-Vertex Cover Number (β₂(G)), hem Vertex Cover hem de 2-Domination şartlarını sağlayan minimum node kümesinin boyutunu ölçer.
              Bu metrik, grafin hem bağlantısal kontrolünü hem de yedekliliğini gösterir.
              <div className="mt-2 space-y-1">
                <div><strong>Vertex Cover şartı:</strong> Her edge'in en az bir ucu seçili olmalı</div>
                <div><strong>2-Domination şartı:</strong> Seçilmeyen her node, seçili en az 2 node'a bağlı olmalı</div>
                <div><strong>Düşük değer (1-2):</strong> Çok az node ile hem kontrol hem yedeklilik sağlanıyor, merkezi yapı güçlü</div>
                <div><strong>Orta değer (3-5):</strong> Birkaç node ile hem kontrol hem yedeklilik sağlanıyor</div>
                <div><strong>Yüksek değer (6+):</strong> Çok sayıda node gerekir, merkezi yapı zayıf</div>
                <div><strong>Node sayısına eşit:</strong> Her node ayrı kontrol edilmeli, hiç bağlantı yok veya çok zayıf yapı</div>
              </div>
            </div>
          </div>
          </Card>

        {/* Degree Distribution Panel */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-4">Degree Distribution</h3>
          <div className="space-y-3">
            {projectGraph.metrics.degreeDistribution && 
             Object.keys(projectGraph.metrics.degreeDistribution).length > 0 ? (
              <>
                <div className="space-y-2">
                  {Object.entries(projectGraph.metrics.degreeDistribution)
                    .sort(([a], [b]) => Number(a) - Number(b))
                    .map(([degree, count]) => {
                      const percentage = (count / projectGraph.metrics.totalNodes) * 100;
                      return (
                        <div key={degree} className="text-sm">
                          <span className="font-medium">Degree {degree}:</span> {count} node ({percentage.toFixed(1)}%)
                        </div>
                      );
                    })}
                </div>
                <div className="text-xs text-muted-foreground pt-2 border-t">
                  Degree Distribution, grafın her degree değerine sahip kaç node olduğunu gösterir.
                  Bu dağılım, grafin yapısı hakkında önemli bilgiler verir.
                  <div className="mt-2 space-y-1">
                    <div><strong>Yüksek degree'li node'lar:</strong> Merkezi, kritik node'lar (God class, controller bottleneck)</div>
                    <div><strong>Düşük degree'li node'lar:</strong> İzole veya bağımsız modüller</div>
                    <div><strong>Homojen dağılım:</strong> Tüm node'lar benzer bağlantı sayısına sahip, dengeli yapı</div>
                    <div><strong>Heterojen dağılım:</strong> Bazı node'lar çok bağlantılı, bazıları az, merkezi yapı</div>
                    <div><strong>Degree 0:</strong> Hiç bağlantısı olmayan izole node'lar</div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">
                Degree distribution data not available.
              </div>
            )}
          </div>
        </Card>

        {/* Class Table */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-3">Class Details</h3>
          <div className="border rounded-md max-h-80 overflow-auto text-xs">
            <table className="w-full">
              <thead className="bg-muted/40">
                <tr>
                  <th className="text-left px-3 py-2">Class</th>
                  <th className="text-right px-3 py-2">Methods</th>
                  <th className="text-right px-3 py-2">Dependencies</th>
                </tr>
              </thead>
              <tbody>
                {topClasses.map(cls => {
                  const metrics = cls.metrics || {};
                  const totalMethods = metrics.totalMethods ?? 0;
                  const totalDependencies = metrics.totalDependencies ?? 0;
                  return (
                    <tr key={cls.id} className="border-t hover:bg-muted/20 cursor-pointer">
                      <td className="px-3 py-2 font-mono break-all">{cls.id}</td>
                      <td className="px-3 py-2 text-right">{totalMethods}</td>
                      <td className="px-3 py-2 text-right">{totalDependencies}</td>
                    </tr>
                  );
                })}
                {topClasses.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-3 py-3 text-center text-muted-foreground">
                      No classes found in project graph.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  };

  const renderCodeQualityView = () => {
    // Türkçe açıklama: code-quality aslında metrics + code smell kombinasyonu, bu yüzden özet kart + detay tablo gösteriyoruz
    const data = getParsedData('code-quality');
    if (!data) {
      return <div className="text-sm text-red-500">Code quality data is not valid JSON.</div>;
    }

    // Türkçe açıklama: Backend şu an analyzedFiles, totalFiles, averageQualityScore gibi alanlar dönüyor
    // Eğer summary yoksa bunlardan anlamlı bir özet obje oluşturuyoruz
    const baseSummary =
      data.summary ||
      data.projectSummary || {
        'Analyzed Files': data.analyzedFiles ?? data.totalFiles ?? '-',
        'Total Files': data.totalFiles ?? data.analyzedFiles ?? '-',
        'Average Quality Score':
          data.averageQualityScore != null
            ? Number(data.averageQualityScore).toFixed(2)
            : '-',
      };

    const summary = baseSummary || {};
    const files = Array.isArray(data.files) ? data.files : [];

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(summary).map(([key, value]) => (
            <Card key={key} className="p-3">
              <div className="text-xs text-muted-foreground">{key}</div>
              <div className="text-lg font-semibold">{String(value)}</div>
            </Card>
          ))}
          {Object.keys(summary).length === 0 && (
            <div className="col-span-2 text-sm text-muted-foreground">
              No code quality summary available.
            </div>
          )}
        </div>

        {/* Türkçe açıklama: Her dosya için overallScore ve en kritik smell skorlarını tablo halinde gösteriyoruz */}
        <div className="border rounded-md max-h-80 overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="text-left px-3 py-2">File</th>
                <th className="text-right px-3 py-2">Overall Score</th>
                <th className="text-left px-3 py-2">Smell Scores</th>
              </tr>
            </thead>
            <tbody>
              {files.map((file: any, idx: number) => {
                const codeSmell = file.codeSmell || {};
                const overallScore = codeSmell.overallScore;
                const smellScores = codeSmell.smellScores || {};
                const smellEntries = Object.entries(smellScores);

                // Türkçe açıklama: Skora göre en düşük (en problemli) birkaç smell'i öne çıkarıyoruz
                const sortedSmells = smellEntries
                  .map(([name, value]) => ({ name, value: Number(value) }))
                  .sort((a, b) => a.value - b.value)
                  .slice(0, 4);

                return (
                  <tr key={idx} className="border-t align-top">
                    <td className="px-3 py-2 font-mono text-xs break-all">{file.filePath}</td>
                    <td className="px-3 py-2 text-right">
                      {overallScore != null ? Number(overallScore).toFixed(2) : '-'}
                    </td>
                    <td className="px-3 py-2">
                      {sortedSmells.length === 0 ? (
                        <span className="text-muted-foreground text-xs">
                          No smell scores
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {sortedSmells.map(smell => (
                            <span
                              key={smell.name}
                              className="inline-flex items-center rounded bg-muted px-2 py-0.5 text-[11px]"
                            >
                              {smell.name}:{' '}
                              <span className="ml-1 font-medium">
                                {smell.value.toFixed(1)}
                              </span>
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {files.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-3 py-4 text-center text-muted-foreground">
                    No file-level quality data available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderActiveAnalysisContent = () => {
    if (!activeAnalysis) return null;

    switch (activeAnalysis) {
      case 'coverage':
        return renderCoverageView();
      case 'metrics':
        return renderMetricsView();
      case 'code-smell':
        return renderCodeSmellView();
      case 'security':
        return renderSecurityView();
      case 'clone-detection':
        return renderCloneDetectionView();
      case 'code-graph':
        // code-graph analizi için de project graph görselleştirmesini göster
        return renderProjectGraphView();
      case 'code-quality':
        return renderCodeQualityView();
      case 'project-graph':
        return renderProjectGraphView();
      default: {
        const data = getParsedData(activeAnalysis);
        if (!data) {
          return (
            <div className="text-sm text-red-500">
              Data for this analysis type is not valid JSON or not available.
            </div>
          );
        }
        return (
          <pre className="p-4 bg-muted/30 rounded overflow-auto text-xs">
            {JSON.stringify(data, null, 2)}
          </pre>
        );
      }
    }
  };
  
  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Analysis Results</h3>
        <div className="flex flex-wrap gap-2">
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
          <Button 
            variant="outline" 
            onClick={() => runAnalysis('metrics')}
            disabled={analyzing}
          >
            Run Metrics Analysis
          </Button>
          <Button 
            variant="outline" 
            onClick={() => runAnalysis('code-graph')}
            disabled={analyzing}
          >
            Run Code Graph Analysis
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              setActiveAnalysis('project-graph');
              if (!projectGraph && !projectGraphError) {
                await loadProjectGraph();
              }
            }}
            disabled={analyzing || projectGraphLoading}
          >
            View Project Code Graph
          </Button>
          <Button 
            variant="outline" 
            onClick={() => runAnalysis('clone-detection')}
            disabled={analyzing}
          >
            Run Clone Detection
          </Button>
          <Button 
            variant="default"
            onClick={runAllAnalyses}
            disabled={analyzing}
          >
            Run All Analyses
          </Button>
        </div>
      </div>
      {analyzing && (
        <div className="mb-4 space-y-2">
          <div className="text-sm text-muted-foreground text-center">
            Running analyses, this may take a while...
          </div>
          <Progress value={runAllProgress} />
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
              {activeAnalysis && results.find(r => r.analysisType === activeAnalysis) && (
                <VoiceReader
                  text={(() => {
                    const result = results.find(r => r.analysisType === activeAnalysis);
                    if (!result) return '';
                    try {
                      const data = JSON.parse(result.resultData);
                      return `Analysis results: ${JSON.stringify(data, null, 2)}`;
                    } catch {
                      return result.resultData;
                    }
                  })()}
                  title={`${activeAnalysis} Analysis Results`}
                  className="mb-4"
                />
              )}
              {renderActiveAnalysisContent()}
            </TabsContent>
          </Tabs>
        </div>
      )}
    </Card>
  );
}
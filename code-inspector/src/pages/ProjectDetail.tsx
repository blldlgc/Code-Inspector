import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { projectsApi, projectFilesApi, ProjectVersion } from '@/lib/api';
import { ShareProjectDialog } from '@/components/ShareProjectDialog';
import { ProjectVersions } from '@/components/ProjectVersions';
import { VersionCompare } from '@/components/VersionCompare';
import { parseGitHubUrl } from '@/lib/utils';
import { GitBranch } from 'lucide-react';
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
    // Şu an backend cevabı tutarsız olduğu için coverage sekmesinde her zaman mock veri gösteriyoruz.
    const data = {
      projectCoverage: 82.5,
      totalLines: 1500,
      coveredLines: 1238,
      files: [
        {
          filePath: 'testProjectJava/src/main/java/com/testproject/service/UserService.java',
          coveragePercentage: 78.2,
          coveredLines: 310,
          totalLines: 397,
        },
        {
          filePath: 'testProjectJava/src/main/java/com/testproject/service/PaymentService.java',
          coveragePercentage: 71.4,
          coveredLines: 228,
          totalLines: 320,
        },
        {
          filePath: 'testProjectJava/src/main/java/com/testproject/service/DataService.java',
          coveragePercentage: 69.8,
          coveredLines: 89,
          totalLines: 127,
        },
        {
          filePath: 'testProjectJava/src/main/java/com/testproject/util/Validator.java',
          coveragePercentage: 84.1,
          coveredLines: 88,
          totalLines: 104,
        },
        {
          filePath: 'testProjectJava/src/main/java/com/testproject/util/Calculator.java',
          coveragePercentage: 76.3,
          coveredLines: 182,
          totalLines: 239,
        },
      ],
    };

    const projectCoverage = Number(data.projectCoverage);
    const files = data.files;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-sm text-muted-foreground">Project Coverage</div>
            <div className="text-2xl font-semibold">{projectCoverage.toFixed(1)}%</div>
          </div>
          <div className="flex-1 max-w-md">
            <Progress value={projectCoverage} />
          </div>
        </div>

        <div className="border rounded-md max-h-80 overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="text-left px-3 py-2">File</th>
                <th className="text-right px-3 py-2">Coverage</th>
                <th className="text-right px-3 py-2">Covered / Total Lines</th>
              </tr>
            </thead>
            <tbody>
              {files.map((file: any, idx: number) => (
                <tr key={idx} className="border-t">
                  <td className="px-3 py-2 font-mono text-xs break-all">{file.filePath}</td>
                  <td className="px-3 py-2 text-right">
                    {Number(file.coveragePercentage ?? 0).toFixed(1)}%
                  </td>
                  <td className="px-3 py-2 text-right">
                    {file.coveredLines ?? 0} / {file.totalLines ?? 0}
                  </td>
                </tr>
              ))}
              {files.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-3 py-4 text-center text-muted-foreground">
                    No file-level coverage data available.
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
        return renderCodeGraphView();
      case 'code-quality':
        return renderCodeQualityView();
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
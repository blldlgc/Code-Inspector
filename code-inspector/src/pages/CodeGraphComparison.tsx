import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PageLayout } from "@/components/PageLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ForceGraph2D from 'react-force-graph-2d';
import { exampleCodes } from '@/constants/exampleCodes';

interface Vertex {
  id: string;
  label: string;
  type: string;
}

interface Edge {
  source: string;
  target: string;
  type: string;
}

interface Graph {
  vertices: Vertex[];
  edges: Edge[];
}

interface Metrics {
  graph1_edge_count: number;
  graph2_vertex_count: number;
  graph1_vertex_count: number;
  graph2_edge_count: number;
}

interface Properties {
  allowCycles: boolean;
  directed: boolean;
  allowSelfLoops: boolean;
  weighted: boolean;
}

interface RepoData {
  methodDependencies: { [className: string]: { [methodName: string]: string[] } };
  classes: string[];
  classDependencies: { [className: string]: string[] };
  classMethods: { [className: string]: string[] };
  graphMetrics?: {
    toughnessNumber: number;
    connectivityNumber: number;
    scatteringNumber: number;
    ruptureNumber: number;
    integrityNumber: number;
    dominationNumber: number;
    coveringNumber: number;
    degreeMetrics: {
      maxDegree: number;
      avgDegree: number;
      totalNodes: number;
    };
    debugInfo: {
      actualEdges: number;
      isolatedNodes: number;
      connectedComponents: number;
      totalEdges: number;
      avgDegree: number;
      graphDensity: number;
      totalNodes: number;
    };
  };
}

interface RepositoryAnalysis {
  repo1: RepoData;
  repo2: RepoData;
}

interface ApiResponse {
  graph1: Graph;
  graph2: Graph;
  metrics: Metrics;
  properties: Properties;
  vulnerability_metrics?: {
    graph1?: {
      Connectivity: number;
      Density: number;
      Toughness: number;
      ScatteringNumber: number;
      RuptureNumber: number;
      IntegrityNumber: number;
      DominationNumber: number;
    };
    graph2?: {
      Connectivity: number;
      Density: number;
      Toughness: number;
      ScatteringNumber: number;
      RuptureNumber: number;
      IntegrityNumber: number;
      DominationNumber: number;
    };
  };
}

function convertRepoToGraph(repoData: RepoData, repoName: string): Graph {
  const vertices: Vertex[] = [];
  const edges: Edge[] = [];
  const vertexIds = new Set<string>();

  // Sınıfları düğüm olarak ekle
  repoData.classes.forEach(className => {
    const classId = `${repoName}_class_${className}`;
    if (!vertexIds.has(classId)) {
      vertices.push({
        id: classId,
        label: className,
        type: 'class'
      });
      vertexIds.add(classId);
    }

    // Sınıfın metodlarını düğüm olarak ekle
    if (repoData.classMethods[className]) {
      repoData.classMethods[className].forEach(methodName => {
        const methodId = `${repoName}_method_${className}_${methodName}`;
        if (!vertexIds.has(methodId)) {
          vertices.push({
            id: methodId,
            label: `${className}.${methodName}`,
            type: 'method'
          });
          vertexIds.add(methodId);
        }

        // Sınıf ile metodu arasında bağlantı
        edges.push({
          source: classId,
          target: methodId,
          type: 'contains'
        });
      });
    }
  });

  // Metot bağımlılıklarını ekle
  Object.keys(repoData.methodDependencies).forEach(className => {
    Object.keys(repoData.methodDependencies[className]).forEach(methodName => {
      const sourceMethodId = `${repoName}_method_${className}_${methodName}`;
      
      repoData.methodDependencies[className][methodName].forEach(dependency => {
        // Bağımlılık başka bir metot olabilir
        const dotIndex = dependency.lastIndexOf('.');
        if (dotIndex > 0) {
          const depClassName = dependency.substring(0, dotIndex);
          const depMethodName = dependency.substring(dotIndex + 1);
          const targetMethodId = `${repoName}_method_${depClassName}_${depMethodName}`;
          
          if (vertexIds.has(targetMethodId)) {
            edges.push({
              source: sourceMethodId,
              target: targetMethodId,
              type: 'method_dependency'
            });
          }
        }
      });
    });
  });

  // Sınıf bağımlılıklarını ekle
  Object.keys(repoData.classDependencies).forEach(className => {
    const sourceClassId = `${repoName}_class_${className}`;
    
    repoData.classDependencies[className].forEach(dependency => {
      const targetClassId = `${repoName}_class_${dependency}`;
      
      if (vertexIds.has(targetClassId)) {
        edges.push({
          source: sourceClassId,
          target: targetClassId,
          type: 'class_dependency'
        });
      }
    });
  });

  return { vertices, edges };
}

function parseJavaOutput(javaOutput: string): ApiResponse {
  console.log('Input to parseJavaOutput:', javaOutput.substring(0, 200) + '...');
  console.log('Input length:', javaOutput.length);
  console.log('Input type:', typeof javaOutput);
  
  if (!javaOutput || typeof javaOutput !== 'string') {
    console.error('Invalid input to parseJavaOutput:', javaOutput);
    throw new Error('Invalid input: javaOutput must be a non-empty string');
  }

  // Hata mesajları içeren string'leri kontrol et
  if (javaOutput.includes('Hata:') || javaOutput.includes('Error:')) {
    console.log('Input contains error messages, attempting to extract valid JSON...');
    
    // JSON kısmını bulmaya çalış (genellikle { ile başlar)
    const jsonStartIndex = javaOutput.indexOf('{');
    const jsonEndIndex = javaOutput.lastIndexOf('}');
    
    if (jsonStartIndex !== -1 && jsonEndIndex !== -1 && jsonEndIndex > jsonStartIndex) {
      const potentialJson = javaOutput.substring(jsonStartIndex, jsonEndIndex + 1);
      console.log('Found potential JSON part:', potentialJson.substring(0, 200) + '...');
      
      try {
        const testParse = JSON.parse(potentialJson);
        if (testParse.repo1 && testParse.repo2) {
          console.log('Successfully extracted valid JSON from error response');
          javaOutput = potentialJson; // JSON kısmını kullan
        }
      } catch (e) {
        console.log('Extracted part is not valid JSON, continuing with original...');
      }
    }
  }

  try {
    const data: RepositoryAnalysis = JSON.parse(javaOutput);
    console.log('Parsed JSON data successfully:', data);

    // Veri yapısını kontrol et
    if (!data.repo1 && !data.repo2) {
      console.error('Both repo1 and repo2 are missing in parsed data:', data);
      throw new Error('Both repo1 and repo2 are missing in data');
    }

    // En azından bir repo'nun geçerli olduğunu kontrol et
    if (data.repo1 && !data.repo1.classes) {
      console.error('Invalid repo1 structure - missing classes array');
      throw new Error('Invalid repository structure: repo1 missing classes');
    }
    
    if (data.repo2 && !data.repo2.classes) {
      console.error('Invalid repo2 structure - missing classes array');
      throw new Error('Invalid repository structure: repo2 missing classes');
    }

    // Repository'leri grafa çevir
    let graph1, graph2;
    
    if (data.repo1) {
      console.log('Converting repo1 to graph...');
      graph1 = convertRepoToGraph(data.repo1, 'repo1');
      console.log('Graph1 created with', graph1.vertices.length, 'vertices and', graph1.edges.length, 'edges');
    } else {
      console.log('repo1 is null, creating empty graph...');
      graph1 = { vertices: [], edges: [] };
    }

    if (data.repo2) {
      console.log('Converting repo2 to graph...');
      graph2 = convertRepoToGraph(data.repo2, 'repo2');
      console.log('Graph2 created with', graph2.vertices.length, 'vertices and', graph2.edges.length, 'edges');
    } else {
      console.log('repo2 is null, creating empty graph...');
      graph2 = { vertices: [], edges: [] };
    }

    // Metrikleri hesapla
    const metrics: Metrics = {
      graph1_vertex_count: graph1.vertices.length,
      graph1_edge_count: graph1.edges.length,
      graph2_vertex_count: graph2.vertices.length,
      graph2_edge_count: graph2.edges.length
    };

    // Varsayılan özellikler
    const properties: Properties = {
      allowCycles: true,
      directed: true,
      allowSelfLoops: false,
      weighted: false
    };

    // Graph metrics'leri işle
    const vulnerability_metrics: any = {};
    
    console.log('Processing graph metrics...');
    console.log('repo1 exists:', !!data.repo1);
    console.log('repo2 exists:', !!data.repo2);
    console.log('repo1.graphMetrics exists:', !!(data.repo1 && data.repo1.graphMetrics));
    console.log('repo2.graphMetrics exists:', !!(data.repo2 && data.repo2.graphMetrics));
    
    if (data.repo1 && data.repo1.graphMetrics) {
      console.log('Processing repo1 graphMetrics:', data.repo1.graphMetrics);
      const gm1 = data.repo1.graphMetrics;
      vulnerability_metrics.graph1 = {
        Connectivity: gm1.connectivityNumber,
        Density: gm1.debugInfo.graphDensity,
        Toughness: gm1.toughnessNumber,
        ScatteringNumber: gm1.scatteringNumber,
        RuptureNumber: gm1.ruptureNumber,
        IntegrityNumber: gm1.integrityNumber,
        DominationNumber: gm1.dominationNumber,
        CoveringNumber: gm1.coveringNumber,
        DegreeMetrics: gm1.degreeMetrics,
        DebugInfo: gm1.debugInfo
      };
      console.log('Created vulnerability_metrics.graph1:', vulnerability_metrics.graph1);
    } else {
      console.log('repo1 is null or graphMetrics not found, skipping vulnerability_metrics.graph1');
    }
    
    if (data.repo2 && data.repo2.graphMetrics) {
      console.log('Processing repo2 graphMetrics:', data.repo2.graphMetrics);
      const gm2 = data.repo2.graphMetrics;
      vulnerability_metrics.graph2 = {
        Connectivity: gm2.connectivityNumber,
        Density: gm2.debugInfo.graphDensity,
        Toughness: gm2.toughnessNumber,
        ScatteringNumber: gm2.scatteringNumber,
        RuptureNumber: gm2.ruptureNumber,
        IntegrityNumber: gm2.integrityNumber,
        DominationNumber: gm2.dominationNumber,
        CoveringNumber: gm2.coveringNumber,
        DegreeMetrics: gm2.degreeMetrics,
        DebugInfo: gm2.debugInfo
      };
      console.log('Created vulnerability_metrics.graph2:', vulnerability_metrics.graph2);
    } else {
      console.log('repo2 is null or graphMetrics not found, skipping vulnerability_metrics.graph2');
    }
    
    console.log('Final vulnerability_metrics:', vulnerability_metrics);

    const result = {
      graph1,
      graph2,
      metrics,
      properties,
      vulnerability_metrics: Object.keys(vulnerability_metrics).length > 0 ? vulnerability_metrics : undefined
    };

    console.log('Parse completed successfully. Final result summary:');
    console.log('- Graph1:', result.graph1.vertices.length, 'vertices,', result.graph1.edges.length, 'edges');
    console.log('- Graph2:', result.graph2.vertices.length, 'vertices,', result.graph2.edges.length, 'edges');
    console.log('- Metrics:', result.metrics);
    
    return result;

  } catch (error) {
    console.error('JSON Parse Error:', error);
    console.error('Input that failed to parse (first 500 chars):', javaOutput.substring(0, 500));
    console.error('Input that failed to parse (last 500 chars):', javaOutput.substring(Math.max(0, javaOutput.length - 500)));
    
    // Hata mesajında daha detaylı bilgi ver
    if (error instanceof SyntaxError) {
      throw new Error(`JSON Syntax Error: ${error.message}. Check if the input contains valid JSON.`);
    }
    
    throw new Error(`Failed to parse JSON: ${error.message}`);
  }
}

// Benzerlik hesaplama fonksiyonu
function calculateSimilarity(metrics1: any, metrics2: any): number {
  console.log('Calculating similarity between:', metrics1, metrics2);

  // Normalize edilecek metrikler
  const metricKeys = [
    "Toughness",
    "Connectivity",
    "ScatteringNumber",
    "RuptureNumber",
    "IntegrityNumber",
    "DominationNumber",
    "CoveringNumber"
  ] as const;

  // Metrik ağırlıkları
  const weights: Record<typeof metricKeys[number], number> = {
    Toughness: 2.0,
    IntegrityNumber: 1.5,
    CoveringNumber: 1.5,
    DominationNumber: 1.2,
    ScatteringNumber: 1.0,
    RuptureNumber: 1.0,
    Connectivity: 1.0
  };

  // Toplam düğüm sayıları
  const totalNodes1 = metrics1?.DebugInfo?.totalNodes || metrics1?.DegreeMetrics?.totalNodes || 1;
  const totalNodes2 = metrics2?.DebugInfo?.totalNodes || metrics2?.DegreeMetrics?.totalNodes || 1;

  console.log('Total nodes:', { totalNodes1, totalNodes2 });

  let weightedDifferences = 0;
  let totalWeight = 0;

  metricKeys.forEach(key => {
    const val1 = metrics1?.[key];
    const val2 = metrics2?.[key];

    console.log(`Processing metric ${key}:`, { val1, val2 });

    if (val1 !== undefined && val2 !== undefined) {
      // Metrikleri normalize et
      const normalizedVal1 = val1 / totalNodes1;
      const normalizedVal2 = val2 / totalNodes2;

      console.log(`Normalized values for ${key}:`, { normalizedVal1, normalizedVal2 });

      // Fark oranını hesapla
      const maxVal = Math.max(normalizedVal1, normalizedVal2);
      const difference = maxVal !== 0 ? Math.abs(normalizedVal1 - normalizedVal2) / maxVal : 0;

      console.log(`Difference for ${key}:`, { difference, weight: weights[key] });

      // Ağırlıklı farkı ekle
      weightedDifferences += difference * weights[key];
      totalWeight += weights[key];
    }
  });

  console.log('Final calculations:', { weightedDifferences, totalWeight });

  // Ağırlıklı ortalama farkı hesapla
  const averageDifference = totalWeight > 0 ? weightedDifferences / totalWeight : 1;

  // Benzerlik oranını hesapla (0-1 arası)
  const similarity = 1 - averageDifference;

  console.log('Final similarity:', similarity);

  return similarity;
}

export default function CodeGraphComparisonPage() {
  const [originalCode, setOriginalCode] = useState("");
  const [comparedCode, setComparedCode] = useState("");
  const [originalGraph, setOriginalGraph] = useState<Graph | null>(null);
  const [comparedGraph, setComparedGraph] = useState<Graph | null>(null);
  const [originalAnalysis, setOriginalAnalysis] = useState<any | null>(null);
  const [comparedAnalysis, setComparedAnalysis] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    setIsLoading(true);

    if (!originalCode.trim() || !comparedCode.trim()) {
      setError("Her iki kod da boş olamaz.");
      setIsLoading(false);
      return;
    }

    try {
      // Orijinal kod analizi
      const originalRes = await fetch("http://localhost:8081/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repo1: originalCode,
          repo2: comparedCode
        }),
      });

      if (!originalRes.ok) {
        const errorText = await originalRes.text();
        throw new Error(`Orijinal kod analizi hatası: ${errorText}`);
      }

      const originalData = await originalRes.json();
      console.log('API Response:', originalData);

      // API'den gelen veriyi parse et
      const parsedData = parseJavaOutput(JSON.stringify(originalData));
      console.log('Parsed Data:', parsedData);

      setOriginalGraph(parsedData.graph1);
      setComparedGraph(parsedData.graph2);

      // Analiz sonuçlarını güncelle
      setOriginalAnalysis({
        totalNodes: parsedData.graph1.vertices.length,
        totalLinks: parsedData.graph1.edges.length,
        metrics: parsedData.vulnerability_metrics?.graph1 || {}
      });

      setComparedAnalysis({
        totalNodes: parsedData.graph2.vertices.length,
        totalLinks: parsedData.graph2.edges.length,
        metrics: parsedData.vulnerability_metrics?.graph2 || {}
      });

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Bilinmeyen bir hata oluştu';
      setError(`Bir hata oluştu: ${errorMessage}`);
      console.error('Error details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const setExampleCodes = () => {
    setOriginalCode(exampleCodes.codeGraphComparison);
    setComparedCode(exampleCodes.codeGraphComparisonModified);
  };

  // Grafik verilerini ForceGraph2D için dönüştür
  const transformGraphData = (graph: Graph) => {
    if (!graph || !graph.vertices || !graph.edges) {
      return { nodes: [], links: [] };
    }

    // Benzersiz node ID'leri oluştur
    const nodeMap = new Map();
    graph.vertices.forEach((vertex, index) => {
      nodeMap.set(vertex.id, {
        id: vertex.id,
        label: vertex.label,
        type: vertex.type,
        color: vertex.type === 'class' ? '#8E44AD' : '#27AE60',
        size: vertex.type === 'class' ? 8 : 6,
        index: index
      });
    });

    // Geçerli linkleri oluştur
    const links = graph.edges
      .filter(edge => nodeMap.has(edge.source) && nodeMap.has(edge.target))
      .map(edge => ({
        source: edge.source,
        target: edge.target,
        type: edge.type,
        color: edge.type === 'dependency' ? '#F39C12' : '#34495E',
        width: edge.type === 'dependency' ? 2 : 3
      }));

    return {
      nodes: Array.from(nodeMap.values()),
      links: links
    };
  };

  return (
    <PageLayout
      title="Code Graph Comparison"
      description="Compare and analyze two different code graphs."
    >
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Repository Comparison</CardTitle>
              <Button
                onClick={setExampleCodes}
                variant="outline"
                size="sm"
                className="text-muted-foreground"
              >
                Load Example Repositories
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Original Repository URL
                  <div className="flex items-center space-x-2">
                    <Textarea
                      value={originalCode}
                      onChange={(e) => setOriginalCode(e.target.value)}
                      placeholder="Enter GitHub repository URL (e.g., https://github.com/username/repo)"
                      className="min-h-[100px] font-mono text-sm"
                    />
                  </div>
                </label>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Repository URL to Compare
                  <div className="flex items-center space-x-2">
                    <Textarea
                      value={comparedCode}
                      onChange={(e) => setComparedCode(e.target.value)}
                      placeholder="Enter GitHub repository URL (e.g., https://github.com/username/repo)"
                      className="min-h-[100px] font-mono text-sm"
                    />
                  </div>
                </label>
              </div>
            </div>
            <Button 
              onClick={handleSubmit} 
              className="mt-6 w-full"
              disabled={!originalCode || !comparedCode || isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? "Analyzing..." : "Compare Repositories"}
            </Button>
          </CardContent>
        </Card>

        {error && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </motion.div>
          </AnimatePresence>
        )}

        {(originalGraph && comparedGraph) && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {originalAnalysis && comparedAnalysis && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Similarity Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Similarity Rate:</h4>
                          <p className="text-2xl font-bold">
                            {(calculateSimilarity(originalAnalysis.metrics, comparedAnalysis.metrics) * 100).toFixed(2)}%
                          </p>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {calculateSimilarity(originalAnalysis.metrics, comparedAnalysis.metrics) > 0.8 
                            ? "These codes show high similarity and may be potential clones."
                            : "These codes show low similarity and are unlikely to be clones."}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Tabs defaultValue="comparison" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="comparison">Graph Comparison</TabsTrigger>
                  <TabsTrigger value="analysis">Analysis Results</TabsTrigger>
                </TabsList>

                <TabsContent value="comparison">
                  <div className="grid grid-cols-2 gap-8">
                    <div className="border rounded-lg p-6">
                      <h3 className="text-lg font-semibold mb-4">Original Graph</h3>
                      <div className="h-[500px] w-full relative overflow-hidden">
                        <ForceGraph2D
                          graphData={transformGraphData(originalGraph)}
                          nodeLabel={node => `${node.label} (${node.type})`}
                          nodeColor={node => node.color}
                          nodeVal={node => node.size}
                          linkColor={link => link.color}
                          linkWidth={link => link.width}
                          linkDirectionalArrowLength={3}
                          linkDirectionalArrowRelPos={1}
                          d3AlphaDecay={0.01}
                          d3VelocityDecay={0.05}
                          cooldownTime={10000}
                          enableZoomInteraction={true}
                          enablePanInteraction={true}
                          enableNodeDrag={true}
                          onNodeClick={(node) => {
                            console.log('Clicked node:', node);
                          }}
                          onLinkClick={(link) => {
                            console.log('Clicked link:', link);
                          }}
                          width={500}
                          height={500}
                          minZoom={0.1}
                          maxZoom={2}
                          nodeCanvasObject={(node, ctx, globalScale) => {
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
                        />
                      </div>
                      <div className="mt-4 flex items-center justify-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 rounded-full bg-[#8E44AD]"></div>
                          <span>Class</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 rounded-full bg-[#27AE60]"></div>
                          <span>Method</span>
                        </div>
                      </div>
                    </div>
                    <div className="border rounded-lg p-6">
                      <h3 className="text-lg font-semibold mb-4">Compared Graph</h3>
                      <div className="h-[500px] w-full relative overflow-hidden">
                        <ForceGraph2D
                          graphData={transformGraphData(comparedGraph)}
                          nodeLabel={node => `${node.label} (${node.type})`}
                          nodeColor={node => node.color}
                          nodeVal={node => node.size}
                          linkColor={link => link.color}
                          linkWidth={link => link.width}
                          linkDirectionalArrowLength={3}
                          linkDirectionalArrowRelPos={1}
                          d3AlphaDecay={0.01}
                          d3VelocityDecay={0.05}
                          cooldownTime={10000}
                          enableZoomInteraction={true}
                          enablePanInteraction={true}
                          enableNodeDrag={true}
                          onNodeClick={(node) => {
                            console.log('Clicked node:', node);
                          }}
                          onLinkClick={(link) => {
                            console.log('Clicked link:', link);
                          }}
                          width={500}
                          height={500}
                          minZoom={0.1}
                          maxZoom={2}
                          nodeCanvasObject={(node, ctx, globalScale) => {
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
                        />
                      </div>
                      <div className="mt-4 flex items-center justify-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 rounded-full bg-[#8E44AD]"></div>
                          <span>Class</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 rounded-full bg-[#27AE60]"></div>
                          <span>Method</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="analysis">
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Original Code Analysis</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {originalAnalysis && (
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-medium">Total Nodes: {originalAnalysis.totalNodes}</h4>
                              <h4 className="font-medium">Total Links: {originalAnalysis.totalLinks}</h4>
                            </div>
                            <div>
                              <h4 className="font-medium">Metrics:</h4>
                              <div className="space-y-4">
                                <div>
                                  <h5 className="font-medium text-sm text-muted-foreground">Basic Metrics</h5>
                                  <ul className="list-disc pl-4">
                                    {Object.entries(originalAnalysis.metrics).map(([key, value]) => {
                                      if (typeof value === 'object' && value !== null) return null;
                                      return (
                                        <li key={key} className="text-sm">
                                          {key}: {typeof value === 'number' ? value.toFixed(2) : value}
                                        </li>
                                      );
                                    })}
                                  </ul>
                                </div>
                                
                                {originalAnalysis.metrics.DegreeMetrics && (
                                  <div>
                                    <h5 className="font-medium text-sm text-muted-foreground">Degree Metrics</h5>
                                    <ul className="list-disc pl-4">
                                      {Object.entries(originalAnalysis.metrics.DegreeMetrics).map(([key, value]) => {
                                        if (typeof value === 'object' && value !== null) return null;
                                        return (
                                          <li key={key} className="text-sm">
                                            {key}: {typeof value === 'number' ? value.toFixed(2) : value}
                                          </li>
                                        );
                                      })}
                                    </ul>
                                  </div>
                                )}

                                {originalAnalysis.metrics.DebugInfo && (
                                  <div>
                                    <h5 className="font-medium text-sm text-muted-foreground">Debug Info</h5>
                                    <ul className="list-disc pl-4">
                                      {Object.entries(originalAnalysis.metrics.DebugInfo).map(([key, value]) => {
                                        if (typeof value === 'object' && value !== null) return null;
                                        return (
                                          <li key={key} className="text-sm">
                                            {key}: {typeof value === 'number' ? value.toFixed(2) : value}
                                          </li>
                                        );
                                      })}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle>Compared Code Analysis</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {comparedAnalysis && (
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-medium">Total Nodes: {comparedAnalysis.totalNodes}</h4>
                              <h4 className="font-medium">Total Links: {comparedAnalysis.totalLinks}</h4>
                            </div>
                            <div>
                              <h4 className="font-medium">Metrics:</h4>
                              <div className="space-y-4">
                                <div>
                                  <h5 className="font-medium text-sm text-muted-foreground">Basic Metrics</h5>
                                  <ul className="list-disc pl-4">
                                    {Object.entries(comparedAnalysis.metrics).map(([key, value]) => {
                                      if (typeof value === 'object' && value !== null) return null;
                                      return (
                                        <li key={key} className="text-sm">
                                          {key}: {typeof value === 'number' ? value.toFixed(2) : value}
                                        </li>
                                      );
                                    })}
                                  </ul>
                                </div>
                                
                                {comparedAnalysis.metrics.DegreeMetrics && (
                                  <div>
                                    <h5 className="font-medium text-sm text-muted-foreground">Degree Metrics</h5>
                                    <ul className="list-disc pl-4">
                                      {Object.entries(comparedAnalysis.metrics.DegreeMetrics).map(([key, value]) => {
                                        if (typeof value === 'object' && value !== null) return null;
                                        return (
                                          <li key={key} className="text-sm">
                                            {key}: {typeof value === 'number' ? value.toFixed(2) : value}
                                          </li>
                                        );
                                      })}
                                    </ul>
                                  </div>
                                )}

                                {comparedAnalysis.metrics.DebugInfo && (
                                  <div>
                                    <h5 className="font-medium text-sm text-muted-foreground">Debug Info</h5>
                                    <ul className="list-disc pl-4">
                                      {Object.entries(comparedAnalysis.metrics.DebugInfo).map(([key, value]) => {
                                        if (typeof value === 'object' && value !== null) return null;
                                        return (
                                          <li key={key} className="text-sm">
                                            {key}: {typeof value === 'number' ? value.toFixed(2) : value}
                                          </li>
                                        );
                                      })}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </PageLayout>
  );
} 
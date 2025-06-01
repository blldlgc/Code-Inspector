// Graph veri yapıları
export interface Node {
  id: string;
  name: string;
  type: string;
}

export interface Link {
  source: string;
  target: string;
  type: string;
}

export interface GraphData {
  vertices: Array<{
    id: string;
    label: string;
    type: string;
    complexity?: number;
    metrics?: {
      cyclomaticComplexity: number;
      cognitiveComplexity: number;
      maintainabilityIndex: number;
    };
  }>;
  edges: Array<{
    source: string;
    target: string;
    type: string;
  }>;
}

// Analiz sonuçları için tipler
export interface AnalysisResult {
  totalNodes: number;
  totalLinks: number;
  averageComplexity: number;
  metrics: {
    cyclomaticComplexity: number;
    cognitiveComplexity: number;
    maintainabilityIndex: number;
  };
}

// Karşılaştırma sonuçları için tipler
export interface ComparisonResult {
  originalGraph: GraphData;
  comparedGraph: GraphData;
  differences: {
    addedNodes: Array<{ id: string; name: string; type: string }>;
    removedNodes: Array<{ id: string; name: string; type: string }>;
    addedLinks: Array<{ source: string; target: string; type: string }>;
    removedLinks: Array<{ source: string; target: string; type: string }>;
    complexityChanges: Array<{ nodeId: string; oldComplexity: number; newComplexity: number }>;
  };
}

// Metrik karşılaştırmaları için tipler
export interface MetricComparison {
  metric: string;
  originalValue: number;
  comparedValue: number;
  difference: number;
  percentageChange: number;
} 
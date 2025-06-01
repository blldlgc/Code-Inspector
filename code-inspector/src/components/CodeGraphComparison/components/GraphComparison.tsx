import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraphVisualization } from "./GraphVisualization";
import { GraphAnalyzer } from "./GraphAnalyzer";
import { GraphData, AnalysisResult } from "../types";

interface GraphComparisonProps {
  originalGraph: GraphData;
  comparedGraph: GraphData;
  onComparisonComplete: (result: { original: AnalysisResult; compared: AnalysisResult }) => void;
}

export const GraphComparison = ({ originalGraph, comparedGraph, onComparisonComplete }: GraphComparisonProps) => {
  const [originalAnalysis, setOriginalAnalysis] = useState<AnalysisResult | null>(null);
  const [comparedAnalysis, setComparedAnalysis] = useState<AnalysisResult | null>(null);

  useEffect(() => {
    if (originalGraph && comparedGraph) {
      // Analiz sonuçlarını hesapla
      const originalResult = {
        totalNodes: originalGraph.vertices.length,
        totalLinks: originalGraph.edges.length,
        averageComplexity: originalGraph.vertices.reduce((sum, node) => sum + (node.complexity || 0), 0) / originalGraph.vertices.length,
        metrics: {
          cyclomaticComplexity: originalGraph.vertices.reduce((sum, node) => sum + (node.metrics?.cyclomaticComplexity || 0), 0) / originalGraph.vertices.length,
          cognitiveComplexity: originalGraph.vertices.reduce((sum, node) => sum + (node.metrics?.cognitiveComplexity || 0), 0) / originalGraph.vertices.length,
          maintainabilityIndex: originalGraph.vertices.reduce((sum, node) => sum + (node.metrics?.maintainabilityIndex || 0), 0) / originalGraph.vertices.length
        }
      };

      const comparedResult = {
        totalNodes: comparedGraph.vertices.length,
        totalLinks: comparedGraph.edges.length,
        averageComplexity: comparedGraph.vertices.reduce((sum, node) => sum + (node.complexity || 0), 0) / comparedGraph.vertices.length,
        metrics: {
          cyclomaticComplexity: comparedGraph.vertices.reduce((sum, node) => sum + (node.metrics?.cyclomaticComplexity || 0), 0) / comparedGraph.vertices.length,
          cognitiveComplexity: comparedGraph.vertices.reduce((sum, node) => sum + (node.metrics?.cognitiveComplexity || 0), 0) / comparedGraph.vertices.length,
          maintainabilityIndex: comparedGraph.vertices.reduce((sum, node) => sum + (node.metrics?.maintainabilityIndex || 0), 0) / comparedGraph.vertices.length
        }
      };

      setOriginalAnalysis(originalResult);
      setComparedAnalysis(comparedResult);
      onComparisonComplete({ original: originalResult, compared: comparedResult });
    }
  }, [originalGraph, comparedGraph, onComparisonComplete]);

  return (
    <div className="grid grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Original Graph</CardTitle>
        </CardHeader>
        <CardContent>
          <GraphVisualization data={originalGraph} />
          {originalAnalysis && <GraphAnalyzer data={originalAnalysis} />}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Compared Graph</CardTitle>
        </CardHeader>
        <CardContent>
          <GraphVisualization data={comparedGraph} />
          {comparedAnalysis && <GraphAnalyzer data={comparedAnalysis} />}
        </CardContent>
      </Card>
    </div>
  );
}; 
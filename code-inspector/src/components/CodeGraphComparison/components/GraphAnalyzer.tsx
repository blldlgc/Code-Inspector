import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnalysisResult } from "../types";

interface GraphAnalyzerProps {
  data: AnalysisResult;
}

export const GraphAnalyzer = ({ data }: GraphAnalyzerProps) => {
  const analysis = useMemo(() => {
    if (!data) return null;

    return {
      totalNodes: data.totalNodes || 0,
      totalLinks: data.totalLinks || 0,
      averageComplexity: data.averageComplexity || 0,
      metrics: {
        cyclomaticComplexity: data.metrics?.cyclomaticComplexity || 0,
        cognitiveComplexity: data.metrics?.cognitiveComplexity || 0,
        maintainabilityIndex: data.metrics?.maintainabilityIndex || 0
      }
    };
  }, [data]);

  if (!analysis) return null;

  return (
    <div className="mt-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Graph Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">Total Nodes</p>
              <p className="text-2xl font-bold">{analysis.totalNodes}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Total Links</p>
              <p className="text-2xl font-bold">{analysis.totalLinks}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Complexity Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium">Cyclomatic Complexity</p>
              <p className="text-2xl font-bold">{analysis.metrics.cyclomaticComplexity.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Cognitive Complexity</p>
              <p className="text-2xl font-bold">{analysis.metrics.cognitiveComplexity.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Maintainability Index</p>
              <p className="text-2xl font-bold">{analysis.metrics.maintainabilityIndex.toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PageLayout } from "@/components/PageLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import GraphVisualizer from "@/components/GraphVisualizer";
import TreeVisualizer from "@/components/TreeVisualizer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { exampleCodes } from '@/constants/exampleCodes';

interface ComplexityNode {
  label: string;
  startLine: number;
  endLine: number;
  children?: ComplexityNode[];
  type: string;
  code: string;
  complexity: number;
}

interface GraphData {
  rootNode: ComplexityNode;
  complexity: number;
  error: string | null;
  complexityDetails: string[];
}

export default function CodeGraph() {
  const [code, setCode] = useState("");
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [treeData, setTreeData] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    setIsLoading(true);
    setTreeData(null);

    if (!code.trim()) {
      setError("Kod boş olamaz.");
      setIsLoading(false);
      return;
    }

    try {
      const complexityRes = await fetch("http://localhost:8080/api/code/graph", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      if (!complexityRes.ok) {
        throw new Error(`Complexity analizi hatası!`);
      }

      const complexityData = await complexityRes.json();
      setGraphData(complexityData);

      try {
        const treeSitterRes = await fetch("http://localhost:8080/api/tree-sitter", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });

        if (!treeSitterRes.ok) {
          throw new Error(`TreeSitter analizi hatası!`);
        }

        const treeSitterData = await treeSitterRes.json();
        setTreeData(treeSitterData.nodes);
      } catch (treeErr) {
        console.error("TreeSitter hatası:", treeErr);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Bilinmeyen bir hata oluştu';
      setError(`Bir hata oluştu: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const setExampleCode = () => {
    setCode(exampleCodes.codeGraph);
  };

  return (
    <PageLayout
      title="Code Graph Analysis"
      description="Visualize and analyze the complexity graph of your code."
    >
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Code Input</CardTitle>
              <Button
                onClick={setExampleCode}
                variant="outline"
                size="sm"
                className="text-muted-foreground"
              >
                Load Example Code
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <label className="text-sm font-medium">Source Code</label>
              <Textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter your code for graph analysis..."
                className="min-h-[300px] font-mono text-sm"
              />
            </div>
            <Button 
              onClick={handleSubmit} 
              className="mt-6 w-full"
              disabled={!code || isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? "Analyzing..." : "Generate Graph"}
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

        {(graphData || treeData) && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Code Analysis Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="complexity" className="w-full">
                    <TabsList className="grid w-full" style={{ 
                      gridTemplateColumns: treeData ? "1fr 1fr" : "1fr" 
                    }}>
                      <TabsTrigger value="complexity">Complexity Graph</TabsTrigger>
                      {treeData && <TabsTrigger value="treesitter">AST Visualization</TabsTrigger>}
                    </TabsList>
                    <TabsContent value="complexity">
                      <div className="w-full border rounded-lg bg-muted/50 overflow-hidden">
                        <div className="h-[500px] p-4">
                          {graphData && <GraphVisualizer data={graphData.rootNode} />}
                        </div>
                      </div>
                    </TabsContent>
                    <TabsContent value="treesitter">
                      <div className="w-full border rounded-lg bg-muted/50 overflow-hidden">
                        <div className="h-[500px] p-4">
                          {treeData && <TreeVisualizer data={treeData} />}
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </PageLayout>
  );
} 
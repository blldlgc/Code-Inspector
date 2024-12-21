import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import TreeVisualizer from "@/components/TreeVisualizer";
import { PageLayout } from "@/components/PageLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

export default function TreeSitter() {
  const [code, setCode] = useState("");
  const [treeData, setTreeData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    setIsLoading(true);

    if (!code.trim()) {
      setError("Code cannot be empty.");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("http://localhost:8080/api/tree-sitter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
      }

      const data = await res.json();
      console.log("API Response:", data);

      if (data && data.nodes && Array.isArray(data.nodes)) {
        setTreeData(data.nodes); // Gelen veriyi ayarla
      } else {
        throw new Error("Invalid data structure from API.");
      }
    } catch (error) {
      console.error("Error:", error);
      setError(`An error occurred: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageLayout
      title="Code Graph Analysis"
      description="Visualize and analyze the graph structure of your code."
    >
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Code Input</CardTitle>
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

        {treeData && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Code Graph Visualization</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="w-full border rounded-lg bg-muted/50 overflow-hidden">
                    <div className="h-[500px] p-4">
                      <TreeVisualizer data={treeData} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </PageLayout>
  )
}

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import { PageLayout } from "@/components/PageLayout"
import { motion, AnimatePresence } from "framer-motion"
import { exampleCodes } from '@/constants/exampleCodes';

interface MetricsResponse {
  metrics: Record<string, string>;
}

export default function MetricsAnalyzer() {
  const [code, setCode] = useState<string>("")
  const [metrics, setMetrics] = useState<Record<string, string> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const analyzeCode = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch("http://localhost:8080/api/code/metrics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code }),
      })
       if (!response.ok) {
        throw new Error("An error occurred while analyzing metrics")
      }
       const data: MetricsResponse = await response.json()
      setMetrics(data.metrics)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const setExampleCode = () => {
    setCode(exampleCodes.metrics);
  };

  return (
    <PageLayout 
      title="Code Metrics Analysis"
      description="Analyze your code and get detailed metrics about its complexity and structure."
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
                placeholder="Paste your code here for analysis..."
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="min-h-[300px] font-mono text-sm"
              />
            </div>
            <Button 
              onClick={analyzeCode} 
              className="mt-6 w-full"
              disabled={!code || loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Analyzing..." : "Analyze Code"}
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

        {metrics && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Analysis Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(metrics).map(([key, value], index) => (
                      <motion.div
                        key={key}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="flex flex-col p-4 border rounded-lg bg-muted/50"
                      >
                        <span className="text-sm font-medium text-muted-foreground capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <span className="text-2xl font-bold mt-1">{value}</span>
                      </motion.div>
                    ))}
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

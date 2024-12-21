import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

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

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Code Metric Analysis</h1>
      
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Enter Code</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Paste the code to analyze here..."
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="min-h-[200px] font-mono"
            />
            <Button 
              onClick={analyzeCode} 
              className="mt-4"
              disabled={!code || loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Analyze
            </Button>
          </CardContent>
        </Card>
         {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
         {metrics && (
          <Card>
            <CardHeader>
              <CardTitle>Metric Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(metrics).map(([key, value]) => (
                  <div key={key} className="flex justify-between p-2 border rounded">
                    <span className="font-medium">{key}:</span>
                    <span>{value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

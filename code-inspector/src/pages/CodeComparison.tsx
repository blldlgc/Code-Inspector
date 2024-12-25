import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { PageLayout } from "@/components/PageLayout"
import { motion, AnimatePresence } from "framer-motion";
import { exampleCodes } from '@/constants/exampleCodes';

interface ComparisonResult {
  CPDsimilarityPercentage: number;
  simianSimilarityPercentage: number;
  matchedLines: string;
  code1Metrics: {
    [key: string]: number;
  };
  code2Metrics: {
    [key: string]: number;
  };
}

const CodeComparison = () => {
    const [code1, setCode1] = useState('');
    const [code2, setCode2] = useState('');
    const [result, setResult] = useState<ComparisonResult | null>(null);
    const [loading, setLoading] = useState(false);

    const setExampleCodes = () => {
        setCode1(exampleCodes.comparison.code1);
        setCode2(exampleCodes.comparison.code2);
    };

    const handleCompare = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:8080/api/code/compare', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ code1, code2 }),
            });

            const data = await response.json();
            setResult(data);
        } catch (error) {
            console.error('Error comparing code:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <PageLayout
            title="Clone Detector"
            description="Compare two code snippets and analyze their similarities."
        >
            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Code Input</CardTitle>
                            <Button
                                onClick={setExampleCodes}
                                variant="outline"
                                size="sm"
                                className="text-muted-foreground"
                            >
                                Load Example Codes
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">First Code Snippet</label>
                                <Textarea
                                    value={code1}
                                    onChange={(e) => setCode1(e.target.value)}
                                    placeholder="Paste your first code snippet here..."
                                    className="min-h-[300px] font-mono text-sm"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Second Code Snippet</label>
                                <Textarea
                                    value={code2}
                                    onChange={(e) => setCode2(e.target.value)}
                                    placeholder="Paste your second code snippet here..."
                                    className="min-h-[300px] font-mono text-sm"
                                />
                            </div>
                        </div>
                        <Button
                            onClick={handleCompare}
                            className="mt-6 w-full"
                            disabled={loading || !code1 || !code2}
                        >
                            {loading ? 'Comparing...' : 'Compare Code'}
                        </Button>
                    </CardContent>
                </Card>

                {result && (
                    <AnimatePresence>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <Card>
                                <CardHeader>
                                    <CardTitle>Comparison Results</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Accordion type="multiple" className="w-full" defaultValue={["similarity"]}>
                                        <AccordionItem value="similarity">
                                            <AccordionTrigger>Similarity Percentage</AccordionTrigger>
                                            <AccordionContent>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
                                                        <div className="space-y-2">
                                                            <h3 className="text-sm font-medium text-muted-foreground">CPD Similarity</h3>
                                                            <div className="flex items-center justify-between">
                                                                <p className="text-3xl font-bold text-primary">
                                                                    {result.CPDsimilarityPercentage.toFixed(2)}%
                                                                </p>
                                                                <div className={`px-3 py-1 rounded-full text-sm ${
                                                                    result.CPDsimilarityPercentage > 80 ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                                                    result.CPDsimilarityPercentage > 50 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                                                    'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                                }`}>
                                                                    {result.CPDsimilarityPercentage > 80 ? 'High' :
                                                                     result.CPDsimilarityPercentage > 50 ? 'Medium' : 'Low'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
                                                        <div className="space-y-2">
                                                            <h3 className="text-sm font-medium text-muted-foreground">Simian Similarity</h3>
                                                            <div className="flex items-center justify-between">
                                                                <p className="text-3xl font-bold text-primary">
                                                                    {result.simianSimilarityPercentage.toFixed(2)}%
                                                                </p>
                                                                <div className={`px-3 py-1 rounded-full text-sm ${
                                                                    result.simianSimilarityPercentage > 80 ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                                                    result.simianSimilarityPercentage > 50 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                                                    'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                                }`}>
                                                                    {result.simianSimilarityPercentage > 80 ? 'High' :
                                                                     result.simianSimilarityPercentage > 50 ? 'Medium' : 'Low'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>

                                        <AccordionItem value="matchedLines">
                                            <AccordionTrigger>Matched Lines</AccordionTrigger>
                                            <AccordionContent>
                                                <pre className="bg-muted p-4 rounded-md overflow-x-auto">{result.matchedLines}</pre>
                                            </AccordionContent>
                                        </AccordionItem>

                                        <AccordionItem value="metrics">
                                            <AccordionTrigger>Comparison Metrics</AccordionTrigger>
                                            <AccordionContent>
                                                <table className="w-full border-collapse">
                                                    <thead>
                                                        <tr>
                                                            <th className="border border-border px-4 py-2 bg-muted">Metric</th>
                                                            <th className="border border-border px-4 py-2 bg-muted">Code 1</th>
                                                            <th className="border border-border px-4 py-2 bg-muted">Code 2</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {result.code1Metrics &&
                                                            Object.keys(result.code1Metrics).map((key) => (
                                                                <tr key={key}>
                                                                    <td className="border border-border px-4 py-2">{key}</td>
                                                                    <td className="border border-border px-4 py-2">{result.code1Metrics[key]}</td>
                                                                    <td className="border border-border px-4 py-2">{result.code2Metrics[key]}</td>
                                                                </tr>
                                                            ))}
                                                    </tbody>
                                                </table>
                                            </AccordionContent>
                                        </AccordionItem>
                                    </Accordion>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </AnimatePresence>
                )}
            </div>
        </PageLayout>
    );
};

export default CodeComparison;

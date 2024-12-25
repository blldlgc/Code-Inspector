import  { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageLayout } from '@/components/PageLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import axios from 'axios';
import { exampleCodes } from '@/constants/exampleCodes';
import { cn } from "@/lib/utils";

interface SmellScores {
    [key: string]: number;
}

interface SmellDetails {
    [key: string]: string[];
}

interface AnalysisResult {
    smellScores: SmellScores;
    smellDetails: SmellDetails;
    overallScore: number;
}

const CodeSmells = () => {
    const [sourceCode, setSourceCode] = useState('');
    const [results, setResults] = useState<AnalysisResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleAnalyze = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await axios.post('http://localhost:8080/api/code-analysis/analyze', {
                sourceCode: sourceCode
            });
            setResults(response.data);
        } catch (err) {
            setError('Analysis failed: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const setExampleCode = () => {
        setSourceCode(exampleCodes.codeSmells);
    };

    return (
        <PageLayout 
            title="Code Smell Detector" 
            description="Detect potential design flaws and maintainability issues in your code"
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
                                placeholder="Enter your code here"
                                value={sourceCode}
                                onChange={(e) => setSourceCode(e.target.value)}
                                className="min-h-[300px] font-mono text-sm"
                            />
                        </div>
                        <Button 
                            onClick={handleAnalyze}
                            disabled={loading || !sourceCode}
                            className="mt-6 w-full"
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {loading ? 'Analyzing...' : 'Analyze Code'}
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

                {results && (
                    <AnimatePresence>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle>Analysis Results</CardTitle>
                                        <div className={cn(
                                            "px-3 py-1 rounded-full text-sm",
                                            results.overallScore > 80 ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" :
                                            results.overallScore > 50 ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" :
                                            "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                        )}>
                                            Overall Score: {results.overallScore.toFixed(2)}%
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid gap-4">
                                        {Object.entries(results.smellScores).map(([smellType, score]) => (
                                            <div key={smellType} className="rounded-lg border p-4">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="font-medium">{smellType}</span>
                                                    <span className={cn(
                                                        "px-2.5 py-0.5 rounded-full text-xs font-medium",
                                                        score > 80 ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" :
                                                        score > 50 ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" :
                                                        "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                                    )}>
                                                        {score.toFixed(0)}%
                                                    </span>
                                                </div>
                                                <div className="w-full bg-secondary rounded-full h-2">
                                                    <div 
                                                        className={cn(
                                                            "h-2 rounded-full transition-all",
                                                            score > 80 ? "bg-green-500" :
                                                            score > 50 ? "bg-yellow-500" :
                                                            "bg-red-500"
                                                        )}
                                                        style={{ width: `${score}%` }}
                                                    />
                                                </div>
                                                {results.smellDetails[smellType] && (
                                                    <div className="mt-2 text-sm text-muted-foreground">
                                                        {results.smellDetails[smellType].map((detail, index) => (
                                                            <div key={index}>{detail}</div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </AnimatePresence>
                )}
            </div>
        </PageLayout>
    );
};

export default CodeSmells;

import React, { useState } from 'react';
import axios from 'axios';
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { PageLayout } from "@/components/PageLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils"
import { exampleCodes } from '@/constants/exampleCodes';

interface TestResult {
    testCode: string;
    className: string;
    numberOfTests: number;
    success: boolean;
    errorMessage: string | null;
    coveragePercentage: number;
    coveredInstructions: number;
    totalInstructions: number;
    methodCoverages: {
        [key: string]: {
            methodName: string;
            coveredLines: number;
            totalLines: number;
        };
    };
}

export default function TestGenerator() {
    const [sourceCode, setSourceCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<TestResult | null>(null);

    const handleSubmit = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await axios.post('http://localhost:8080/api/code/generate-test', {
                sourceCode
            });

            setResult(response.data);
            console.log(response.data);
        } catch (error) {
            setError('Test generation failed. Please check your code and try again.');
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const setExampleCodes = () => {
        setSourceCode(exampleCodes.testGenerator.sourceCode);
    };

    return (
        <PageLayout
            title="Test Generator"
            description="Automatically generate unit tests for your Java code."
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
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Java Source Code</label>
                            <Textarea
                                value={sourceCode}
                                onChange={(e) => setSourceCode(e.target.value)}
                                placeholder="Paste your Java code here..."
                                className="min-h-[300px] font-mono text-sm"
                            />
                        </div>
                        <Button
                            onClick={handleSubmit}
                            className="mt-6 w-full"
                            disabled={!sourceCode || loading}
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {loading ? "Generating Tests..." : "Generate Tests"}
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
                                    <CardTitle>Generated Tests</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-6">
                                        {/* Test Özeti */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="p-4 rounded-lg border bg-card">
                                                <p className="text-sm text-muted-foreground">Number of Tests</p>
                                                <p className="text-2xl font-bold">{result.numberOfTests}</p>
                                            </div>
                                            <div className="p-4 rounded-lg border bg-card">
                                                <p className="text-sm text-muted-foreground">Coverage</p>
                                                <p className="text-2xl font-bold">{result.coveragePercentage.toFixed(2)}%</p>
                                            </div>
                                            <div className="p-4 rounded-lg border bg-card">
                                                <p className="text-sm text-muted-foreground">Status</p>
                                                <p className={`text-2xl font-bold ${result.success ? 'text-green-500' : 'text-red-500'}`}>
                                                    {result.success ? 'Success' : 'Failed'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Generated Test Code */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Generated Test Code</label>
                                            <div className="relative">
                                                <Textarea
                                                    value={result.testCode}
                                                    readOnly
                                                    className="min-h-[300px] font-mono text-sm bg-muted"
                                                />
                                                <Button
                                                    onClick={() => navigator.clipboard.writeText(result.testCode)}
                                                    variant="outline"
                                                    size="sm"
                                                    className="absolute top-2 right-2"
                                                >
                                                    Copy Code
                                                </Button>
                                            </div>
                                        </div>

                                    {/* Method-based Coverage */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold">Method Coverage</h3>
                                    <div className="grid gap-4">
                                        {Object.entries(result.methodCoverages).map(([methodName, data]) => {
                                            const percentage = (data.coveredLines / data.totalLines) * 100;
                                            return (
                                                <div key={methodName} className="rounded-lg border p-4">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <code className="text-sm font-mono">{methodName}</code>
                                                        <span className={cn(
                                                            "px-2.5 py-0.5 rounded-full text-xs font-medium",
                                                            percentage === 100 
                                                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                                                : percentage === 0 
                                                                    ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                                                    : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                                        )}>
                                                            {percentage.toFixed(0)}%
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-secondary rounded-full h-2">
                                                        <div 
                                                            className={cn(
                                                                "h-2 rounded-full transition-all",
                                                                percentage === 100 
                                                                    ? "bg-green-500"
                                                                    : percentage === 0 
                                                                        ? "bg-red-500"
                                                                        : "bg-yellow-500"
                                                            )}
                                                            style={{ width: `${percentage}%` }}
                                                        />
                                                    </div>
                                                    <p className="text-sm text-muted-foreground mt-2">
                                                        {data.coveredLines} / {data.totalLines} lines covered
                                                    </p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </AnimatePresence>
                )}
            </div>
        </PageLayout>
    );
} 
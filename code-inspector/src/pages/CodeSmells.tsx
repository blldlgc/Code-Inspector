import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageLayout } from '@/components/PageLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import axios from 'axios';
import { exampleCodes } from '@/constants/exampleCodes';

const CodeSmells = () => {
    const [sourceCode, setSourceCode] = useState('');
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleAnalyze = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await axios.post('http://localhost:8080/api/sonar/analyze', {
                sourceCode: sourceCode,
                projectKey: `squ_c75726952288a8ba06f6d9191b66db8c2917d741`
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
                                    <CardTitle>Analysis Results</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <ResultCard title="Bugs" value={results.bugs} />
                                        <ResultCard title="Vulnerabilities" value={results.vulnerabilities} />
                                        <ResultCard title="Code Smells" value={results.codeSmells} />
                                        <ResultCard title="Coverage" value={`${results.coverage.toFixed(2)}%`} />
                                        <ResultCard title="Duplicated Lines" value={`${results.duplicatedLinesDensity.toFixed(2)}%`} />
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

const ResultCard = ({ title, value }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col p-4 border rounded-lg bg-muted/50"
    >
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        <span className="text-2xl font-bold mt-1">{value}</span>
    </motion.div>
);

export default CodeSmells;

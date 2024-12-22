import React, { useState } from 'react';
import axios from 'axios';
import { Textarea } from "@/components/ui/textarea";
import  { Button } from "@/components/ui/button";
import { PageLayout } from "@/components/PageLayout"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { exampleCodes } from '@/constants/exampleCodes';

export default function CodeCoverage() {
    const [appCode, setAppCode] = useState('');
    const [testCode, setTestCode] = useState('');
    const [coverage, setCoverage] = useState<any>(null);

    const handleSubmit = async () => {
        try {
            const requestData = {
                sourceCode: appCode,
                testCode: testCode
            };

            const response = await axios.post('http://localhost:8080/api/code/coverage', requestData);
            
            setCoverage(response.data);
            
            console.log('Coverage Data:', response.data);
        } catch (error) {
            console.error('Error calculating coverage:', error);
        }
    };

    const setExampleCodes = () => {
        setAppCode(exampleCodes.coverage.appCode);
        setTestCode(exampleCodes.coverage.testCode);
    };

    return (
        <PageLayout
            title="Code Coverage Analysis"
            description="Calculate test coverage for your application code."
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
                                <label className="text-sm font-medium">Application Code</label>
                                <Textarea
                                    value={appCode}
                                    onChange={(e) => setAppCode(e.target.value)}
                                    placeholder="Paste your application code here..."
                                    className="min-h-[300px] font-mono text-sm"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Test Code</label>
                                <Textarea
                                    value={testCode}
                                    onChange={(e) => setTestCode(e.target.value)}
                                    placeholder="Paste your test code here..."
                                    className="min-h-[300px] font-mono text-sm"
                                />
                            </div>
                        </div>
                        <div className="mt-6">
                            <Button
                                onClick={handleSubmit}
                                className="w-full"
                                disabled={!appCode || !testCode}
                            >
                                Calculate Coverage
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {coverage && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Coverage Analysis Results</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {/* Overall Coverage Percentage */}
                                <div className="flex items-center justify-center">
                                    <div className="text-center">
                                        <p className="text-sm font-medium text-muted-foreground">Overall Test Coverage</p>
                                        <div className="mt-2 flex items-baseline justify-center gap-2">
                                            <p className="text-5xl font-bold">{coverage.coveragePercentage.toFixed(2)}%</p>
                                            <span className="text-sm text-muted-foreground">
                                                ({coverage.coveredInstructions}/{coverage.totalInstructions} lines)
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Method-based Coverage */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold">Method Coverage</h3>
                                    <div className="grid gap-4">
                                        {Object.entries(coverage.methodCoverages).map(([methodName, data]) => {
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
                )}
            </div>
        </PageLayout>
    );
}

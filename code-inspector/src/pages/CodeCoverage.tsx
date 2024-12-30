import React from 'react';
import { useState } from 'react';
import axios from 'axios';
import { Textarea } from "@/components/ui/textarea";
import  { Button } from "@/components/ui/button";
import { PageLayout } from "@/components/PageLayout"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { exampleCodes } from '@/constants/exampleCodes';
import { useNavigate } from "react-router-dom";
import { RainbowButton } from '@/components/ui/rainbow-button';
import { Loader2 } from "lucide-react";

interface MethodCoverage {
    [key: string]: [number, number]; // [coveredLines, totalLines]
}

interface Coverage {
    coveragePercentage: number;
    coveredLines: number;
    totalLines: number;
    methodCoverage: MethodCoverage;
}

export default function CodeCoverage() {
    const [appCode, setAppCode] = useState('');
    const [testCode, setTestCode] = useState('');
    const [coverage, setCoverage] = useState<Coverage | null>(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async () => {
        try {
            setLoading(true);
            const requestData = {
                sourceCode: appCode,
                testCode: testCode
            };

            const response = await axios.post('http://localhost:8080/api/coverage', requestData);
            
            setCoverage(response.data);
            console.log('Coverage Data:', response.data);
        } catch (error) {
            console.error('Error calculating coverage:', error);
        } finally {
            setLoading(false);
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
                                <label className="text-sm font-medium">Application Code
                                <Textarea
                                    value={appCode}
                                    onChange={(e) => setAppCode(e.target.value)}
                                    placeholder="Paste your application code here..."
                                    className="min-h-[300px] font-mono text-sm"
                                />
                                </label>
                                
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Test Code
                                <Textarea
                                    value={testCode}
                                    onChange={(e) => setTestCode(e.target.value)}
                                    placeholder="Paste your test code here..."
                                    className="min-h-[300px] font-mono text-sm"
                                />
                                </label>
                                
                            </div>
                        </div>
                        <div className="mt-6">
                            <Button
                                onClick={handleSubmit}
                                className="w-full"
                                disabled={!appCode || !testCode || loading}
                            >
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {loading ? "Calculating..." : "Calculate Coverage"}
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
                                {/* Genel Kapsama Yüzdesi */}
                                <div className="p-6 border rounded-lg">
                                    <div className="text-center space-y-4">
                                        <p className="text-lg font-medium text-muted-foreground">Overall Test Coverage</p>
                                        <div className="flex items-baseline justify-center gap-3">
                                            <p className="text-5xl font-bold text-primary">{coverage.coveragePercentage.toFixed(2)}%</p>
                                            <span className="text-sm text-muted-foreground">
                                                ({coverage.coveredLines}/{coverage.totalLines} lines)
                                            </span>
                                        </div>
                                        <div className="w-full bg-secondary rounded-full h-3 mt-4">
                                            <div 
                                                className={cn(
                                                    "h-3 rounded-full transition-all",
                                                    coverage.coveragePercentage > 80 ? "bg-green-500" :
                                                    coverage.coveragePercentage > 50 ? "bg-yellow-500" :
                                                    "bg-red-500"
                                                )}
                                                style={{ width: `${coverage.coveragePercentage}%` }}
                                            />
                                        </div>
                                        {coverage.coveragePercentage < 100 && (
                                            <div className="mt-4 space-y-4">
                                                <RainbowButton
                                                    onClick={() => navigate('/testgenerator', { state: { sourceCode: appCode } })}
                                                    className="w-full max-w-sm mx-auto"
                                                >
                                                    Improve with AI Test Generator
                                                </RainbowButton>
                                                <p className="text-sm text-muted-foreground text-center">
                                                    Use our AI-powered Test Generator to improve your test coverage
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Metot Bazlı Kapsama */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold">Method Coverage</h3>
                                    <div className="grid gap-4">
                                        {Object.entries(coverage.methodCoverage).map(([methodName, [covered, total]]) => {
                                            const percentage = (covered / total) * 100;
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
                                                        {covered} / {total} lines covered
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

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageLayout } from "@/components/PageLayout";
import { motion, AnimatePresence } from "framer-motion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Shield, AlertTriangle, AlertCircle } from "lucide-react";
import axios from 'axios';
import { exampleCodes } from '@/constants/exampleCodes';
import { cn } from "@/lib/utils";

interface Vulnerability {
    type: string;
    description: string;
    riskLevel: string;
    lineNumber: number;
    vulnerableCode: string;
    recommendation: string;
    impact: string;
    issueSeverityScore: number;
}

interface Recommendation {
    category: string;
    description: string;
    recommendation: string;
    priority: string;
    relatedIssues: string[];
}

interface RiskMetrics {
    overallRiskScore: number;
    criticalIssues: number;
    highIssues: number;
    mediumIssues: number;
    lowIssues: number;
    codeQualityScore: number;
    securityScore: number;
    categoryScores: {
        [key: string]: number;
    };
}

interface SecurityAnalysisResult {
    vulnerabilities: {
        [key: string]: Vulnerability[];
    };
    recommendations: Recommendation[];
    riskMetrics: RiskMetrics;
    securityReport: string;
}

const CodeSecurity = () => {
    const [sourceCode, setSourceCode] = useState('');
    const [results, setResults] = useState<SecurityAnalysisResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleAnalyze = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await axios.post('http://localhost:8080/api/security/analyze', {
                sourceCode: sourceCode
            });
            setResults(response.data);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const getRiskLevelColor = (riskLevel: string) => {
        switch (riskLevel.toUpperCase()) {
            case 'CRITICAL': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            case 'HIGH': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
            case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            case 'LOW': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
        }
    };

    const getRiskGrade = (score: number) => {
        if (score >= 90) return 'A+';
        if (score >= 85) return 'A';
        if (score >= 80) return 'A-';
        if (score >= 75) return 'B+';
        if (score >= 70) return 'B';
        if (score >= 65) return 'B-';
        if (score >= 60) return 'C+';
        if (score >= 55) return 'C';
        if (score >= 50) return 'C-';
        if (score >= 45) return 'D+';
        if (score >= 40) return 'D';
        if (score >= 35) return 'D-';
        return 'F';
    };

    const getGradeColor = (grade: string) => {
        if (grade.startsWith('A')) return 'text-green-600 dark:text-green-400';
        if (grade.startsWith('B')) return 'text-blue-600 dark:text-blue-400';
        if (grade.startsWith('C')) return 'text-yellow-600 dark:text-yellow-400';
        if (grade.startsWith('D')) return 'text-orange-600 dark:text-orange-400';
        return 'text-red-600 dark:text-red-400';
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-600 dark:text-green-400';
        if (score >= 60) return 'text-blue-600 dark:text-blue-400';
        if (score >= 40) return 'text-yellow-600 dark:text-yellow-400';
        if (score >= 20) return 'text-orange-600 dark:text-orange-400';
        return 'text-red-600 dark:text-red-400';
    };

    const getIssuesColor = (total: number) => {
        if (total === 0) return 'text-green-600 dark:text-green-400';
        if (total <= 2) return 'text-blue-600 dark:text-blue-400';
        if (total <= 5) return 'text-yellow-600 dark:text-yellow-400';
        if (total <= 8) return 'text-orange-600 dark:text-orange-400';
        return 'text-red-600 dark:text-red-400';
    };

    const setExampleCode = () => {
        setSourceCode(exampleCodes.codesecurity || '');
    };

    return (
        <PageLayout 
            title="Security Analysis" 
            description="Analyze your code for security vulnerabilities and best practices"
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
                            <label className="text-sm font-medium">Source Code
                            <Textarea
                                placeholder="Enter your code here"
                                value={sourceCode}
                                onChange={(e) => setSourceCode(e.target.value)}
                                className="min-h-[300px] font-mono text-sm"
                            />
                            </label>
                            
                        </div>
                        <Button 
                            onClick={handleAnalyze}
                            disabled={loading || !sourceCode}
                            className="mt-6 w-full"
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {loading ? 'Analyzing...' : 'Analyze Security'}
                        </Button>
                    </CardContent>
                </Card>

                {error && (
                    <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {results && (
                    <AnimatePresence>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="grid gap-6"
                        >
                            {/* Risk Metrics Card */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Risk Overview</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="p-4 rounded-lg border">
                                            <div className="flex items-center gap-2">
                                                <Shield className="h-4 w-4" />
                                                <span className="text-sm font-medium">Security Score</span>
                                            </div>
                                            <p className={cn(
                                                "text-2xl font-bold mt-2",
                                                getScoreColor(results.riskMetrics.securityScore)
                                            )}>
                                                {results.riskMetrics.securityScore.toFixed(1)}%
                                            </p>
                                        </div>
                                        <div className="p-4 rounded-lg border">
                                            <div className="flex items-center gap-2">
                                                <AlertTriangle className="h-4 w-4" />
                                                <span className="text-sm font-medium">Risk Grade</span>
                                            </div>
                                            <p className={cn(
                                                "text-2xl font-bold mt-2",
                                                getGradeColor(getRiskGrade(results.riskMetrics.overallRiskScore))
                                            )}>
                                                {getRiskGrade(results.riskMetrics.overallRiskScore)}
                                            </p>
                                        </div>
                                        <div className="p-4 rounded-lg border">
                                            <div className="flex items-center gap-2">
                                                <AlertCircle className="h-4 w-4" />
                                                <span className="text-sm font-medium">Total Issues</span>
                                            </div>
                                            <p className={cn(
                                                "text-2xl font-bold mt-2",
                                                getIssuesColor(
                                                    results.riskMetrics.criticalIssues + 
                                                    results.riskMetrics.highIssues + 
                                                    results.riskMetrics.mediumIssues + 
                                                    results.riskMetrics.lowIssues
                                                )
                                            )}>
                                                {results.riskMetrics.criticalIssues + 
                                                 results.riskMetrics.highIssues + 
                                                 results.riskMetrics.mediumIssues + 
                                                 results.riskMetrics.lowIssues}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="mb-6">
                                <h3 className="text-lg font-semibold mb-4">Category Scores</h3>
                                <div className="grid gap-4">
                                    {/* Kategori skorlarını döngüyle göster */}
                                    {Object.entries(results.riskMetrics.categoryScores).map(([category, score]) => {
                                        return (
                                            <div key={category} className="rounded-lg border p-4">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="font-medium">{category}</span>
                                                    <span className={cn(
                                                        "px-2.5 py-0.5 rounded-full text-xs font-medium",
                                                        score > 80 
                                                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                                            : score > 50 
                                                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                                                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                                    )}>
                                                        {score.toFixed(1)}%
                                                    </span>
                                                </div>
                                                <div className="w-full bg-secondary rounded-full h-2">
                                                    <div 
                                                        className={cn(
                                                            "h-2 rounded-full transition-all",
                                                            score > 80 
                                                                ? "bg-green-500"
                                                                : score > 50 
                                                                    ? "bg-yellow-500"
                                                                    : "bg-red-500"
                                                        )}
                                                        style={{ width: `${score}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Vulnerabilities Card */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Detected Vulnerabilities</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {Object.entries(results.vulnerabilities).map(([type, vulns]) => (
                                            vulns.map((vuln, index) => (
                                                <div key={`${type}-${index}`} className="rounded-lg border p-4">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium">{type}</span>
                                                            <span className={cn(
                                                                "px-2.5 py-0.5 rounded-full text-xs font-medium",
                                                                getRiskLevelColor(vuln.riskLevel)
                                                            )}>
                                                                {vuln.riskLevel}
                                                            </span>
                                                        </div>
                                                        <span className="text-sm text-muted-foreground">
                                                            Line {vuln.lineNumber}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground mb-2">{vuln.description}</p>
                                                    <div className="bg-muted p-2 rounded-md font-mono text-sm mb-2">
                                                        {vuln.vulnerableCode}
                                                    </div>
                                                    <p className="text-sm font-medium mt-2">Recommendation:</p>
                                                    <p className="text-sm text-muted-foreground">{vuln.recommendation}</p>
                                                </div>
                                            ))
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Recommendations Card */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Security Recommendations</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {results.recommendations.map((rec, index) => (
                                            <div key={index} className="rounded-lg border p-4">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="font-medium">{rec.category}</span>
                                                    <span className={cn(
                                                        "px-2.5 py-0.5 rounded-full text-xs font-medium",
                                                        getRiskLevelColor(rec.priority)
                                                    )}>
                                                        {rec.priority}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-muted-foreground mb-2">{rec.description}</p>
                                                <p className="text-sm font-medium">Recommendation:</p>
                                                <p className="text-sm text-muted-foreground">{rec.recommendation}</p>
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

export default CodeSecurity; 
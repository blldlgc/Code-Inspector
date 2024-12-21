import React, { useState } from 'react';
import axios from 'axios';
import { Textarea } from "@/components/ui/textarea";
import  { Button } from "@/components/ui/button";
import { PageLayout } from "@/components/PageLayout"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export default function CodeCoverage() {
    const [appCode, setAppCode] = useState('');
    const [testCode, setTestCode] = useState('');
    const [coverage, setCoverage] = useState('');

    const handleSubmit = async () => {
        try {
        const response = await axios.post('http://localhost:8080/api/coverage', {
            appCode: appCode,
            testCode: testCode,
        });
        setCoverage(response.data.coverage);
        } catch (error) {
        console.error('Error calculating coverage:', error);
        }
        
    };

    return (
        <PageLayout
            title="Code Coverage Analysis"
            description="Calculate test coverage for your application code."
        >
            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Code Input</CardTitle>
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
                        <Button
                            onClick={handleSubmit}
                            className="mt-6 w-full"
                            disabled={!appCode || !testCode}
                        >
                            Calculate Coverage
                        </Button>
                    </CardContent>
                </Card>

                {coverage && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Coverage Results</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-center p-6">
                                <div className="text-center">
                                    <p className="text-sm font-medium text-muted-foreground">Total Coverage</p>
                                    <p className="text-5xl font-bold mt-2">{coverage}%</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </PageLayout>
    );
}

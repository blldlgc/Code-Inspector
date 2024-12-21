import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { PageLayout } from "@/components/PageLayout"
import { motion, AnimatePresence } from "framer-motion";

const CodeComparison = () => {
    const [code1, setCode1] = useState('');
    const [code2, setCode2] = useState('');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

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
            title="Code Comparison"
            description="Compare two code snippets and analyze their similarities."
        >
            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Code Input</CardTitle>
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
                                    <Accordion type="multiple" className="w-full">
                                        <AccordionItem value="similarity" >
                                            <AccordionTrigger>Similarity Percentage</AccordionTrigger>
                                            <AccordionContent>
                                                <p className="text-2xl font-bold text-blue-600">
                                                    CPD: 
                                                    {result.CPDsimilarityPercentage.toFixed(2)}%
                                                </p> 
                                                <p className="text-2xl font-bold text-blue-600">
                                                    Simian: 
                                                    {result.simianSimilarityPercentage.toFixed(2)}%
                                                </p>
                                            </AccordionContent>
                                        </AccordionItem>

                                        <AccordionItem value="matchedLines">
                                            <AccordionTrigger>Matched Lines</AccordionTrigger>
                                            <AccordionContent>
                                                <pre className="bg-gray-100 p-4 rounded-md">{result.matchedLines}</pre>
                                            </AccordionContent>
                                        </AccordionItem>

                                        <AccordionItem value="metrics">
                                            <AccordionTrigger>Comparison Metrics</AccordionTrigger>
                                            <AccordionContent>
                                                <table className="w-full border-collapse border border-gray-200">
                                                    <thead>
                                                        <tr>
                                                            <th className="border border-gray-300 px-4 py-2">Metric</th>
                                                            <th className="border border-gray-300 px-4 py-2">Code 1</th>
                                                            <th className="border border-gray-300 px-4 py-2">Code 2</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {result.code1Metrics &&
                                                            Object.keys(result.code1Metrics).map((key) => (
                                                                <tr key={key}>
                                                                    <td className="border border-gray-300 px-4 py-2">{key}</td>
                                                                    <td className="border border-gray-300 px-4 py-2">{result.code1Metrics[key]}</td>
                                                                    <td className="border border-gray-300 px-4 py-2">{result.code2Metrics[key]}</td>
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

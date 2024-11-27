import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

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
        <div className="max-w-full p-4">
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Code Comparison Tool</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4">
                        <div>
                            <label className="block mb-2 font-medium">First Code Snippet:</label>
                            <Textarea
                                className="w-full h-48 p-2 border rounded-md"
                                value={code1}
                                onChange={(e) => setCode1(e.target.value)}
                                placeholder="Paste your first code here..."
                            />
                        </div>
                        <div>
                            <label className="block mb-2 font-medium">Second Code Snippet:</label>
                            <Textarea
                                className="w-full h-48 p-2 border rounded-md"
                                value={code2}
                                onChange={(e) => setCode2(e.target.value)}
                                placeholder="Paste your second code here..."
                            />
                        </div>
                        <button
                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
                            onClick={handleCompare}
                            disabled={loading || !code1 || !code2}
                        >
                            {loading ? 'Comparing...' : 'Compare Code'}
                        </button>
                    </div>
                </CardContent>
            </Card>

            {result && (
                <Card>
                    <CardHeader>
                        <CardTitle>Comparison Results</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Accordion type="multiple" defaultValue="similarity" >
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
            )}
        </div>
    );
};

export default CodeComparison;

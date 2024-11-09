import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

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
        <div className=" max-w-full p-4">
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

            {result && result.similarityPercentage !== undefined && (
    <Card>
        <CardHeader>
            <CardTitle>Comparison Results</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="space-y-4">
                <div>
                    <h3 className="font-medium">Similarity Percentage:</h3>
                    <p className="text-2xl font-bold text-blue-600">
                        {result.similarityPercentage.toFixed(2)}%
                    </p>
                </div>
                <div>
                    <h3 className="font-medium">Matched Lines:</h3>
                    <pre className="p-4 bg-gray-100 rounded-md whitespace-pre-wrap">
                        {result.matchedLines}
                    </pre>
                </div>
            </div>
        </CardContent>
    </Card>
)}
        </div>
    );
};

export default CodeComparison;
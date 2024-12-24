import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';


import axios from 'axios';

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
                projectKey: `squ_c75726952288a8ba06f6d9191b66db8c2917d741` // Unique project key
            });
            setResults(response.data);
            console.log(response.data);
            console.log("a");
            
        } catch (err) {
            setError('Analysis failed: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto p-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl font-bold">Code Inspector</CardTitle>
                </CardHeader>
                <CardContent>
                    <Textarea
                        rows={10}
                        placeholder="Enter your code here"
                        value={sourceCode}
                        onChange={(e) => setSourceCode(e.target.value)}
                        className="w-full mb-4 p-3 border border-gray-300 rounded-md"
                    />

                    <Button 
                        onClick={handleAnalyze}
                        disabled={loading || !sourceCode}
                        className="w-full mb-4"
                    >
                        {loading ? (
                            <div className="flex justify-center items-center">
                                
                            </div>
                        ) : (
                            'Analyze Code'
                        )}
                    </Button>

                    {error && (
                        <div className="p-4 mb-4 bg-red-100">
                            <p className="text-red-500">{error}</p>
                        </div>
                    )}

                    {results && (
                        <div className="p-4">
                            <h6 className="text-lg font-semibold mb-4">Analysis Results</h6>
                            <div className="grid grid-cols-2 gap-4">
                                <ResultItem label="Bugs" value={results.bugs} />
                                <ResultItem label="Vulnerabilities" value={results.vulnerabilities} />
                                <ResultItem label="Code Smells" value={results.codeSmells} />
                                <ResultItem 
                                    label="Coverage" 
                                    value={`${results.coverage.toFixed(2)}%`} 
                                />
                                <ResultItem 
                                    label="Duplicated Lines" 
                                    value={`${results.duplicatedLinesDensity.toFixed(2)}%`} 
                                />
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

const ResultItem = ({ label, value }) => (
    <div>
        <p className="text-gray-500">{label}</p>
        <p className="text-xl">{value}</p>
    </div>
);

export default CodeSmells;

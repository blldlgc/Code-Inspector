    import React, { useState } from 'react';
    import axios from 'axios';
    import { Textarea } from "@/components/ui/textarea";
    import  { Button } from "@/components/ui/button";

    function CodeCoverage() {
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
        <div className="container mx-auto p-8">
            <h1 className="text-3xl font-bold text-center mb-8">Code Coverage Tool</h1>
            <div className="grid grid-cols-2 gap-8 mb-8">
                <div className="flex flex-col">
                    <label className="mb-2 font-medium">Application Code</label>
                    <Textarea
                        className="h-[400px] resize-none"
                        placeholder="Application Code"
                        value={appCode}
                        onChange={(e) => setAppCode(e.target.value)}
                    />
                </div>
                <div className="flex flex-col">
                    <label className="mb-2 font-medium">Test Code</label>
                    <Textarea
                        className="h-[400px] resize-none"
                        placeholder="Test Code"
                        value={testCode}
                        onChange={(e) => setTestCode(e.target.value)}
                    />
                </div>
            </div>
            <div className="flex flex-col items-center gap-4">
                <Button className="w-48" onClick={handleSubmit}>Calculate Coverage</Button>
                {coverage && <p className="text-xl font-semibold">Code Coverage: {coverage}%</p>}
            </div>
        </div>
    );
    }

    export default CodeCoverage;

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
        <div>
        <h1>Code Coverage Tool</h1>
        <Textarea
            placeholder="Application Code"
            value={appCode}
            onChange={(e) => setAppCode(e.target.value)}
        />
        <Textarea
            placeholder="Test Code"
            value={testCode}
            onChange={(e) => setTestCode(e.target.value)}
        />
        <Button onClick={handleSubmit}>Calculate Coverage</Button>
        {coverage && <p>Code Coverage: {coverage}%</p>}
        </div>
    );
    }

    export default CodeCoverage;

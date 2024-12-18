import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import TreeVisualizer from "@/components/TreeVisualizer";

const TreeSitter = () => {
  const [code, setCode] = useState("");
  const [treeData, setTreeData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    setIsLoading(true);

    if (!code.trim()) {
      setError("Code cannot be empty.");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("http://localhost:8080/api/tree-sitter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
      }

      const data = await res.json();
      console.log("API Response:", data);

      if (data && data.nodes && Array.isArray(data.nodes)) {
        setTreeData(data.nodes); // Gelen veriyi ayarla
      } else {
        throw new Error("Invalid data structure from API.");
      }
    } catch (error) {
      console.error("Error:", error);
      setError(`An error occurred: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center max-w-4xl max-h-96 mx-auto mt-8">
      <h1 className="text-2xl font-bold mb-4">Code Analysis with TreeSitter</h1>

      <Textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Enter your code here"
        className="mb-4 w-full border border-gray-300 p-2"
      />

      <Button onClick={handleSubmit} disabled={isLoading}>
        {isLoading ? "Analyzing..." : "Analyze Code"}
      </Button>

      {error && <p className="text-red-500 mt-2">{error}</p>}

      {treeData && (
        <div className="w-full h-fit mt-6 border p-4 rounded bg-gray-50 shadow">
          <h2 className="text-lg font-semibold mb-2">Tree Visualizer</h2>
          <TreeVisualizer data={treeData} />
        </div>
      )}
    </div>
  );
};

export default TreeSitter;

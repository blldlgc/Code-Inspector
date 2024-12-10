import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import TreeVisualizer from "@/components/TreeVisualizer";

const TreeSitterForm = () => {
  const [code, setCode] = useState(""); // Textbox için state
  const [treeData, setTreeData] = useState(null); // TreeSitter'dan gelen veriyi tutacak state

  const handleSubmit = async () => {
    try {
      const res = await fetch("http://localhost:8080/api/tree-sitter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code }) // Burada uzun Java kodunu gönderiyoruz
      });

      // Cevabı JSON formatında al
      const data = await res.json();
      setTreeData(data.nodes[0]); // Gelen veri ile treeData'yı güncelle
    } catch (error) {
      console.error("Error sending data to TreeSitter:", error);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <h1>Code Analysis with TreeSitter</h1>

      {/* Textbox */}
      <Textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Enter your code here"
        className="mb-4"
      />

      {/* Button */}
      <Button onClick={handleSubmit}>Analyze Code</Button>

      {/* API Cevabını Göster */}
      {treeData && (
        <div className="w-full h-96 mt-4">
          <h1>Tree Visualizer</h1>
          <TreeVisualizer data={treeData} />
        </div>
      )}
    </div>
  );
};

export default TreeSitterForm;

import React, { useEffect, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
} from "reactflow";
import "reactflow/dist/style.css";

// ReactFlow için veriyi dönüştürme
const transformTreeDataForReactFlow = (nodes) => {
  const nodeElements = [];
  const edgeElements = [];

  const traverse = (node, parentId = null, depth = 0, y = 50) => {
    const nodeId = `${node.startByte}-${node.endByte}`;
    const xPosition = depth * 200;

    // Node ekle
    nodeElements.push({
      id: nodeId,
      data: { label: `${node.type} (${node.startRow}:${node.startColumn}-${node.endRow}:${node.endColumn})` },
      position: { x: xPosition, y: y },
    });

    // Bağlantı ekle
    if (parentId) {
      edgeElements.push({
        id: `e${parentId}-${nodeId}`,
        source: parentId,
        target: nodeId,
        animated: true,
      });
    }

    // Alt çocukları sırayla ekle
    if (node.children && node.children.length > 0) {
      node.children.forEach((child, index) =>
        traverse(child, nodeId, depth + 1, y + (index + 1) * 100)
      );
    }
  };

  nodes.forEach((node) => traverse(node));
  return { nodes: nodeElements, edges: edgeElements };
};

const TreeVisualizer = ({ data }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    if (data) {
      const { nodes: transformedNodes, edges: transformedEdges } = transformTreeDataForReactFlow(data);
      setNodes(transformedNodes);
      setEdges(transformedEdges);
    }
  }, [data, setNodes, setEdges]);

  return (
    <div style={{ width: "100%", height: "500px" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
      >
        <MiniMap />
        <Controls />
        <Background variant="dots" gap={16} size={0.5} />
      </ReactFlow>
    </div>
  );
};

export default TreeVisualizer;

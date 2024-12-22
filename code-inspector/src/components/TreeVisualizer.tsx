import React, { useEffect, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
} from "reactflow";
import "reactflow/dist/style.css";

// Gösterilmeyecek node tipleri
const EXCLUDED_NODE_TYPES = [
  "(",
  ")",
  "{",
  "}",
  ";",
  ":",
  ".",
  "<",
  ">",
  "=",
  "import",
  "class",
  "modifiers",
  "identifier",
  "scoped_identifier",
  "type_identifier",
  "return",
  "block",
  "public",
  "private",
  "protected",
  "static",
  "final",
  "abstract",
  "synchronized",
  "for"
];

// ReactFlow için veriyi dönüştürme
const transformTreeDataForReactFlow = (nodes) => {
  const nodeElements = [];
  const edgeElements = [];

  // Modifier'lar için renk şeması ekleyelim
  const modifierStyles = {
    public: {
      background: '#e6ffe6', // açık yeşil
      border: '1px solid #28a745',
      color: '#28a745',
      fontWeight: 'bold'
    },
    private: {
      background: '#ffe6e6', // açık kırmızı
      border: '1px solid #dc3545',
      color: '#dc3545',
      fontWeight: 'bold'
    },
    protected: {
      background: '#fff3e6', // açık turuncu
      border: '1px solid #fd7e14',
      color: '#fd7e14',
      fontWeight: 'bold'
    }
  };

  const traverse = (node, parentId = null, depth = 0, y = 50) => {
    let modifiers = "";
    let nodeStyle = {};

    if (node.children) {
      const modifierNode = node.children.find(child => child.type === "modifiers");
      if (modifierNode && modifierNode.children) {
        modifiers = modifierNode.children
          .map(m => m.type)
          .join(" ") + " ";
        
        // İlk modifier'a göre stil seç
        const firstModifier = modifierNode.children[0]?.type;
        if (firstModifier in modifierStyles) {
          nodeStyle = modifierStyles[firstModifier];
        }
      }
    }

    if (EXCLUDED_NODE_TYPES.includes(node.type.trim())) {
      if (node.children && node.children.length > 0) {
        node.children.forEach((child, index) =>
          traverse(child, parentId, depth, y)
        );
      }
      return;
    }

    const nodeId = `${node.startByte}-${node.endByte}`;
    const xPosition = depth * 200;

    // Node'u modifier bilgisiyle birlikte ekle ve stil uygula
    nodeElements.push({
      id: nodeId,
      data: { 
        label: `${modifiers}${node.type} (${node.startRow}:${node.startColumn}-${node.endRow}:${node.endColumn})` 
      },
      position: { x: xPosition, y },
      style: nodeStyle
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

    // Alt çocuklar için y pozisyonunu hesapla
    if (node.children && node.children.length > 0) {
      const visibleChildren = node.children.filter(
        child => !EXCLUDED_NODE_TYPES.includes(child.type.trim())
      );
      
      node.children.forEach((child, index) => {
        // Sadece görünür node'lar için y offset'i artır
        const yOffset = visibleChildren.findIndex(vc => vc === child) + 1;
        traverse(child, nodeId, depth + 1, y + (yOffset > 0 ? yOffset * 100 : 0));
      });
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

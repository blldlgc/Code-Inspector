import { useEffect } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  BackgroundVariant
} from "reactflow";
import "reactflow/dist/style.css";

interface ComplexityNode {
  label: string;
  startLine: number;
  endLine: number;
  children?: ComplexityNode[];
  type: string;
  code: string;
  complexity: number;
}

interface GraphVisualizerProps {
  data: ComplexityNode;
}

const transformDataForReactFlow = (node: ComplexityNode, parentId: string | null = null, depth = 0, y = 50) => {
  const nodeElements: Node[] = [];
  const edgeElements: Edge[] = [];

  // Node tiplerine göre renk şeması
  const typeStyles = {
    METHOD: {
      background: '#e6f3ff',
      border: '1px solid #0066cc',
      color: '#0066cc',
      fontWeight: 'bold'
    },
    IF_CONDITION: {
      background: '#fff3e6',
      border: '1px solid #ff9900',
      color: '#ff9900',
      fontWeight: 'bold'
    },
    LOOP: {
      background: '#e6ffe6',
      border: '1px solid #00cc00',
      color: '#00cc00',
      fontWeight: 'bold'
    },
    SEQUENCE: {
      background: '#f3e6ff',
      border: '1px solid #6600cc',
      color: '#6600cc',
      fontWeight: 'bold'
    }
  };

  const nodeId = `${node.startLine}-${node.endLine}`;
  const xPosition = depth * 250;
  const style = typeStyles[node.type as keyof typeof typeStyles] || {};

  nodeElements.push({
    id: nodeId,
    data: { 
      label: `${node.label}\n(Lines ${node.startLine}-${node.endLine})\nComplexity: ${node.complexity}` 
    },
    position: { x: xPosition, y },
    style
  });

  if (parentId) {
    edgeElements.push({
      id: `e${parentId}-${nodeId}`,
      source: parentId,
      target: nodeId,
      animated: true,
    });
  }

  if (node.children) {
    node.children.forEach((child, index) => {
      const { nodes: childNodes, edges: childEdges } = transformDataForReactFlow(
        child,
        nodeId,
        depth + 1,
        y + (index + 1) * 150
      );
      nodeElements.push(...childNodes);
      edgeElements.push(...childEdges);
    });
  }

  return { nodes: nodeElements, edges: edgeElements };
};

const GraphVisualizer = ({ data }: GraphVisualizerProps) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    if (data) {
      const { nodes: transformedNodes, edges: transformedEdges } = transformDataForReactFlow(data);
      setNodes(transformedNodes);
      setEdges(transformedEdges);
    }
  }, [data, setNodes, setEdges]);

  return (
    <div style={{ width: "100%", height: "480px" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
      >
        <MiniMap />
        <Controls />
        <Background variant={BackgroundVariant.Dots} gap={16} size={0.5} />
      </ReactFlow>
    </div>
  );
};

export default GraphVisualizer; 
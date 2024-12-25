import { useEffect } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Node,
  Edge
} from "reactflow";
import "reactflow/dist/style.css";

interface TreeNode {
  type: string;
  startByte: number;
  endByte: number;
  startRow: number;
  startColumn: number;
  endRow: number;
  endColumn: number;
  children?: TreeNode[];
}

interface TreeVisualizerProps {
  data: TreeNode[];
}

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
const transformTreeDataForReactFlow = (nodes: TreeNode[]) => {
  const nodeElements: Node[] = [];
  const edgeElements: Edge[] = [];

  // Modifier'lar için renk şeması ekleyelim
  const modifierStyles = {
    public: {
      background: '#e6ffe6',
      border: '1px solid #28a745',
      color: '#28a745',
      fontWeight: 'bold'
    },
    private: {
      background: '#ffe6e6',
      border: '1px solid #dc3545',
      color: '#dc3545',
      fontWeight: 'bold'
    },
    protected: {
      background: '#fff3e6',
      border: '1px solid #fd7e14',
      color: '#fd7e14',
      fontWeight: 'bold'
    }
  };

  const traverse = (node: TreeNode, parentId: string | null = null, depth = 0, y = 50) => {
    let modifiers = "";
    let nodeStyle = {};

    if (node.children) {
      const modifierNode = node.children.find(child => child.type === "modifiers");
      if (modifierNode && modifierNode.children) {
        modifiers = modifierNode.children
          .map(m => m.type)
          .join(" ") + " ";
        
        const firstModifier = modifierNode.children[0]?.type;
        if (firstModifier && firstModifier in modifierStyles) {
          nodeStyle = modifierStyles[firstModifier as keyof typeof modifierStyles];
        }
      }
    }

    if (EXCLUDED_NODE_TYPES.includes(node.type.trim())) {
      if (node.children && node.children.length > 0) {
        node.children.forEach((child) =>
          traverse(child, parentId, depth, y)
        );
      }
      return;
    }

    const nodeId = `${node.startByte}-${node.endByte}`;
    const xPosition = depth * 200;

    nodeElements.push({
      id: nodeId,
      data: { 
        label: `${modifiers}${node.type} (${node.startRow}:${node.startColumn}-${node.endRow}:${node.endColumn})` 
      },
      position: { x: xPosition, y },
      style: nodeStyle
    });

    if (parentId) {
      edgeElements.push({
        id: `e${parentId}-${nodeId}`,
        source: parentId,
        target: nodeId,
        animated: true,
      });
    }

    if (node.children && node.children.length > 0) {
      const visibleChildren = node.children.filter(
        child => !EXCLUDED_NODE_TYPES.includes(child.type.trim())
      );
      
      node.children.forEach((child) => {
        const yOffset = visibleChildren.findIndex(vc => vc === child) + 1;
        traverse(child, nodeId, depth + 1, y + (yOffset > 0 ? yOffset * 100 : 0));
      });
    }
  };

  nodes.forEach((node) => traverse(node));
  return { nodes: nodeElements, edges: edgeElements };
};

const TreeVisualizer = ({ data }: TreeVisualizerProps) => {
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
    <div>
      {/* Renk açıklamaları */}
      <div className="mb-4 flex gap-4">
        <div className="flex items-center">
          <div className="w-4 h-4 mr-2 rounded" style={{ 
            background: '#e6ffe6',
            border: '1px solid #28a745'
          }}></div>
          <span className="text-sm">Public</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 mr-2 rounded" style={{ 
            background: '#ffe6e6',
            border: '1px solid #dc3545'
          }}></div>
          <span className="text-sm">Private</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 mr-2 rounded" style={{ 
            background: '#fff3e6',
            border: '1px solid #fd7e14'
          }}></div>
          <span className="text-sm">Protected</span>
        </div>
      </div>

      {/* Mevcut ReactFlow komponenti */}
      <div style={{ width: "100%", height: "450px" }}>
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
    </div>
  );
};

export default TreeVisualizer;

import { useMemo } from "react";
import ForceGraph2D from "react-force-graph-2d";
import { GraphData } from "../types";

interface GraphVisualizationProps {
  data: GraphData;
}

export const GraphVisualization = ({ data }: GraphVisualizationProps) => {
  const graphData = useMemo(() => {
    // Node'ları oluştur
    const nodes = data.vertices.map(vertex => ({
      id: vertex.id,
      name: vertex.label,
      val: vertex.complexity || 1,
      color: vertex.type === 'class' ? '#ff6b6b' : '#4ecdc4'
    }));

    // Link'leri oluştur ve geçerli node'ları kontrol et
    const validLinks = data.edges.filter(edge => {
      const sourceExists = nodes.some(node => node.id === edge.source);
      const targetExists = nodes.some(node => node.id === edge.target);
      return sourceExists && targetExists;
    });

    return {
      nodes,
      links: validLinks.map(edge => ({
        source: edge.source,
        target: edge.target,
        color: '#999'
      }))
    };
  }, [data]);

  return (
    <div style={{ width: '100%', height: '400px' }}>
      <ForceGraph2D
        graphData={graphData}
        nodeLabel="name"
        nodeRelSize={6}
        linkWidth={1}
        linkDirectionalParticles={2}
        linkDirectionalParticleSpeed={0.005}
      />
    </div>
  );
}; 
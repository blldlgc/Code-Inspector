import React, { useEffect, useRef, useState } from "react";
import * as acorn from "acorn";
import * as d3 from "d3";
import {Textarea} from "@/components/ui/textarea";

const CodeGraph = () => {
  const [code, setCode] = useState("");
  const svgRef = useRef(null);

  useEffect(() => {
    if (code.trim() === "") return;

    // AST oluştur
    const ast = acorn.parse(code, { ecmaVersion: 2020 });

    // AST'yi graph olarak çiz
    const nodes = [];
    const links = [];
    let id = 0;

    const traverseAST = (node, parentId = null) => {
      const nodeId = id++;
      nodes.push({ id: nodeId, name: node.type });
      if (parentId !== null) links.push({ source: parentId, target: nodeId });

      Object.keys(node).forEach((key) => {
        if (key === "start" || key === "end" || key === "loc") return;
        const child = node[key];
        if (Array.isArray(child)) {
          child.forEach((item) => item && typeof item === "object" && traverseAST(item, nodeId));
        } else if (child && typeof child === "object") {
          traverseAST(child, nodeId);
        }
      });
    };

    traverseAST(ast);

    // D3.js ile görselleştirme
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 800, height = 600;
    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id((d) => d.id).distance(50))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2));

    const link = svg.append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", 1.5);

    const node = svg.append("g")
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", 5)
      .attr("fill", "#69b3a2");

    node.append("title").text((d) => d.name);

    simulation.on("tick", () => {
      link
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);

      node
        .attr("cx", (d) => d.x)
        .attr("cy", (d) => d.y);
    });
  }, [code]);

  return (
    <div>
      <Textarea
        placeholder="Kodunuzu buraya yazın..."
        value={code}
        onChange={(e) => setCode(e.target.value)}
        style={{ width: "100%", height: "100px" }}
      />
      <svg ref={svgRef} width="800" height="600" />
    </div>
  );
};

export default CodeGraph;

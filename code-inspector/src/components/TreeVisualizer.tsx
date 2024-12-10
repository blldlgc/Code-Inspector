import React from "react";
import Tree from "react-d3-tree";

const TreeVisualizer = ({ data }) => {
    const transformNodes = (node) => {
        // Burada sınıf adı, metod adı gibi bilgileri kullanarak ağacın yapısını şekillendiriyoruz
        const nodeName = node.type === "class_declaration" ? `Class: ${node.name}` : node.type === "method_declaration" ? `Method: ${node.name}` : node.type;

        return {
            name: nodeName, // Node tipi ya da adı
            attributes: {
                startByte: node.startByte,
                endByte: node.endByte
            },
            children: node.children ? node.children.map(transformNodes) : [],
        };
    };

    const treeData = transformNodes(data);

    return (
        <div className="w-full h-full">
            <Tree
                data={treeData}
                orientation="vertical"
                nodeLabelComponent={{
                    render: <NodeLabel />,
                    foreignObjectWrapper: {
                        y: 20,
                        x: -50
                    }
                }}
            />
        </div>
    );
};

const NodeLabel = ({ nodeData }) => {
    return (
        <div className="bg-white p-2 border border-gray-400 rounded">
            <strong>{nodeData.name}</strong>
            <br />
            <span>Start Byte: {nodeData.attributes.startByte}</span>
            <br />
            <span>End Byte: {nodeData.attributes.endByte}</span>
        </div>
    );
};

export default TreeVisualizer;

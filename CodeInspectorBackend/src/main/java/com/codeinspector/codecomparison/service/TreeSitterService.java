package com.codeinspector.codecomparison.service;

import com.codeinspector.codecomparison.dto.TreeSitterRequest;
import com.codeinspector.codecomparison.dto.TreeSitterResponse;
import org.antlr.v4.runtime.tree.Tree;
import org.treesitter.*;
import org.treesitter.TreeSitterJava;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class TreeSitterService {

    public TreeSitterResponse analyzeCode(String code) {
        TSParser parser = new TSParser();

        try {
            TSLanguage javaLanguage = new TreeSitterJava(); // Tree Sitter için Java dilini ayarla
            parser.setLanguage(javaLanguage);

            TSTree tree = parser.parseString(null, code);
            TSNode rootNode = tree.getRootNode();

            List<TreeSitterResponse.TreeNode> nodes = collectNodes(rootNode);
            return new TreeSitterResponse(rootNode.getType(), nodes, null);

        } catch (Exception e) {
            return new TreeSitterResponse(null, null, "Error analyzing code: " + e.getMessage());
        } finally {
            //parser.close();
        }
    }
    private List<TreeSitterResponse.TreeNode> collectNodes(TSNode node) {
        List<TreeSitterResponse.TreeNode> nodeList = new ArrayList<>();

        for (int i = 0; i < node.getChildCount(); i++) {
            TSNode childNode = node.getChild(i);
            System.out.println(childNode);
            TreeSitterResponse.TreeNode treeNode = new TreeSitterResponse.TreeNode(
                    childNode.getType(),
                    childNode.getStartByte(),
                    childNode.getEndByte(),
                    collectNodes(childNode)
            );
            nodeList.add(treeNode);
        }
        return nodeList;
    }
}

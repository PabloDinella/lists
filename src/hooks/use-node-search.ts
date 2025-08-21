import { useMemo } from 'react';
import FlexSearch from 'flexsearch';
import { TreeNode } from '@/components/node-view/use-list-data';

export interface SearchResult {
  id: number;
  name: string;
  content?: string;
  breadcrumb: string[];
  node: TreeNode;
}

export function useNodeSearch(nodes: TreeNode[]) {
  const { searchIndex, nodeMap } = useMemo(() => {
    // Create FlexSearch index
    const index = new FlexSearch.Index({
      tokenize: 'forward',
      cache: true,
      resolution: 9,
    });

    const map = new Map<number, { node: TreeNode; breadcrumb: string[] }>();

    // Flatten the tree and build search index
    const flattenAndIndex = (nodeList: TreeNode[], breadcrumb: string[] = []) => {
      nodeList.forEach((node) => {
        const currentBreadcrumb = [...breadcrumb, node.name];
        
        // Store node with breadcrumb
        map.set(node.id, { node, breadcrumb: currentBreadcrumb });
        
        // Index the node content
        const searchText = [
          node.name,
          node.content || '',
          ...currentBreadcrumb,
        ].join(' ').toLowerCase();
        
        index.add(node.id, searchText);
        
        // Recursively index children
        if (node.children && node.children.length > 0) {
          flattenAndIndex(node.children, currentBreadcrumb);
        }
      });
    };

    flattenAndIndex(nodes);

    return {
      searchIndex: index,
      nodeMap: map,
    };
  }, [nodes]);

  const search = (query: string, limit = 20): SearchResult[] => {
    if (!query.trim()) return [];

    try {
      const results = searchIndex.search(query.toLowerCase(), { limit });
      
      return (results as number[]).map((id) => {
        const item = nodeMap.get(id);
        if (!item) return null;
        
        return {
          id,
          name: item.node.name,
          content: item.node.content,
          breadcrumb: item.breadcrumb.slice(0, -1), // Remove the current item from breadcrumb
          node: item.node,
        };
      }).filter(Boolean) as SearchResult[];
    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  };

  return { search };
}

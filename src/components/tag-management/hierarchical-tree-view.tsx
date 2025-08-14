import { useListData } from "./use-list-data";

interface HierarchicalTreeViewProps {
  userId: string | null;
  parentNodeId?: number | null;
  onEditStart?: (node: any) => void;
  onDelete?: (nodeId: number) => void;
}

export function HierarchicalTreeView({ userId, parentNodeId, onEditStart, onDelete }: HierarchicalTreeViewProps) {
  const { hierarchicalTree, isLoading, isError } = useListData({
    userId,
    parentNodeId,
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isError) {
    return <div>Error loading data</div>;
  }

  const renderNode = (node: any, depth: number = 0) => {
    return (
      <div key={node.id} style={{ marginLeft: `${depth * 20}px` }}>
        <div className="flex items-center justify-between gap-2 p-2 border rounded mb-2">
          <div className="flex items-center gap-2">
            <span className="font-medium">{node.name}</span>
            {node.content && (
              <span className="text-sm text-gray-600">- {node.content}</span>
            )}
          </div>
          <div className="flex gap-2">
            {onEditStart && (
              <button
                onClick={() => onEditStart(node)}
                className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Edit
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(node.id)}
                className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
              >
                Delete
              </button>
            )}
          </div>
        </div>
        {node.children && node.children.length > 0 && (
          <div>
            {node.children.map((child: any) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Hierarchical Tree View</h2>
      {hierarchicalTree.length === 0 ? (
        <div className="text-gray-500">No items found</div>
      ) : (
        <div>
          {hierarchicalTree.map((node) => renderNode(node))}
        </div>
      )}
      

    </div>
  );
}

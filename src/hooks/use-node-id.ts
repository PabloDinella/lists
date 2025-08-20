import { useParams } from "react-router-dom";

export function useNodeId() {
  const { listId: listIdString } = useParams<{ listId: string }>();
  const nodeId = listIdString ? parseInt(listIdString, 10) : 0;
  
  return nodeId;
}

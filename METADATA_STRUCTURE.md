# Node Metadata Structure

The `metadata` field in the `node` table is a JSON object that controls how nodes behave in the productivity app. This field determines whether a node is structural (a list) or a leaf (a task), and controls the depth to which the tree should be rendered.

## Metadata Schema

### For Structural Nodes (Lists)
```json
{
  "type": "structural",
  "renderDepth": 2
}
```

- **`type: "structural"`**: Indicates this node represents a list or organizational structure (e.g., "Inbox", "Next Actions", "Projects")
- **`renderDepth: 2`**: Controls how many levels deep the tree should render children. A value of 2 means show the list and its immediate children, but not grandchildren.

### For Leaf Nodes (Tasks)
```json
{
  "type": "leaf",
  "renderDepth": 0
}
```

- **`type: "leaf"`**: Indicates this node represents a task or actionable item
- **`renderDepth: 0`**: No children should be rendered (tasks don't have sub-tasks in this implementation)

### Default Behavior
If no metadata is provided, the node defaults to:
```json
{
  "type": "leaf",
  "renderDepth": 0
}
```

## Examples

### Example 1: Inbox List
```json
{
  "name": "Inbox",
  "content": "Capture everything here",
  "metadata": {
    "type": "structural",
    "renderDepth": 2
  }
}
```

### Example 2: Task Item
```json
{
  "name": "Buy groceries",
  "content": "Milk, bread, eggs",
  "metadata": {
    "type": "leaf",
    "renderDepth": 0
  }
}
```

### Example 3: Project List
```json
{
  "name": "Home Renovation",
  "content": "Kitchen and bathroom updates",
  "metadata": {
    "type": "structural",
    "renderDepth": 3
  }
}
```

## How It Works

1. **Tree Rendering**: The `renderDepth` controls how many levels of children are displayed in the hierarchical view
2. **Edit Sheet Behavior**: 
   - Structural nodes (`type: "structural"`) hide the related nodes selection fields
   - Leaf nodes (`type: "leaf"`) show the related nodes selection fields for linking tasks
3. **UI Labels**: The edit sheet automatically shows appropriate titles and descriptions based on the node type

## Database Migration

To add the metadata field to existing nodes, you can run:

```sql
-- Add metadata column if it doesn't exist
ALTER TABLE node ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT NULL;

-- Update existing root nodes (nodes without parents) to be structural
UPDATE node 
SET metadata = '{"type": "structural", "renderDepth": 2}'::jsonb
WHERE parent_node IS NULL;

-- Update existing child nodes to be leaf nodes
UPDATE node 
SET metadata = '{"type": "leaf", "renderDepth": 0}'::jsonb
WHERE parent_node IS NOT NULL;
```

## Testing the Implementation

To verify that metadata is being loaded correctly:

1. **Check the browser console** for any errors
2. **Verify database data** - check if nodes have metadata values
3. **Test tree rendering** - structural nodes should show children, leaf nodes should not
4. **Test edit sheet behavior** - structural nodes should hide related fields, leaf nodes should show them

## Troubleshooting

If metadata is still not loading:

1. **Check database**: Verify that nodes have metadata values
2. **Check network requests**: Look at the browser's Network tab to see if metadata is being returned
3. **Check type definitions**: Ensure all components are using the same Node type
4. **Clear cache**: Try invalidating React Query cache or refreshing the page

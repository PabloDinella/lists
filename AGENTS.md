# Project guidance

Read the README's Data model section before changing node, list, or relationship behavior.

- Keep the underlying model generic. GTD destinations are configured list IDs and GTD-specific choices belong in UI workflows, not database relationship types.
- `parent_node` is the single owning parent. A `member_of` relationship adds display membership in another list without reparenting the node. Removing that membership must never delete the node.
- `tagged_with` relationships are tags. Preserve relationship type and direction when loading `related_nodes`; tag editors must only change tag links.
- Keep additional members separate from structural children when traversing, ordering, moving, or deleting nodes. A node may appear in several lists but has one identity and one owner.
- Add focused tests for changes to membership selection, list display, and ownership semantics.

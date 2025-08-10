import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Plus, Trash2, Tag, FolderOpen, Edit } from "lucide-react";
import { AppLayout } from "./app-layout";
import { useTags } from "@/hooks/use-tags";
import { useCreateTag } from "@/hooks/use-create-tag";
import { useDeleteTag } from "@/hooks/use-delete-tag";
import { useUpdateTag } from "@/hooks/use-update-tag";
import { useTagTypes } from "@/hooks/use-tag-types";
import { useCreateTagType } from "@/hooks/use-create-tag-type";
import { useDeleteTagType } from "@/hooks/use-delete-tag-type";
import { supabase } from "@/lib/supabase";

export function TagManagement() {
  const [user, setUser] = useState<{ id: string } | null>(null);
  const { data: tags, isLoading, isError } = useTags(user?.id);
  const { data: tagTypes, isLoading: tagTypesLoading, isError: tagTypesError } = useTagTypes(user?.id);
  const createTagMutation = useCreateTag();
  const deleteTagMutation = useDeleteTag();
  const updateTagMutation = useUpdateTag();
  const createTagTypeMutation = useCreateTagType();
  const deleteTagTypeMutation = useDeleteTagType();
  const [newTagName, setNewTagName] = useState("");
  const [newTagTypeName, setNewTagTypeName] = useState("");
  const [createTagDialogOpen, setCreateTagDialogOpen] = useState(false);
  const [createTagTypeDialogOpen, setCreateTagTypeDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<{ id: number; name: string } | null>(null);
  const [editingTagName, setEditingTagName] = useState("");

  // Get current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }: { data: { user: { id: string } | null } }) => setUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_event: unknown, session: { user: { id: string } | null } | null) => {
      setUser(session?.user ?? null);
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  if (!user) {
    return <div>Please sign in to manage tags.</div>;
  }

  const handleCreateTag = async () => {
    if (newTagName.trim() && user?.id) {
      try {
        await createTagMutation.mutateAsync({ 
          name: newTagName.trim(), 
          userId: user.id 
        });
        setNewTagName("");
        setCreateTagDialogOpen(false);
      } catch (error) {
        console.error("Failed to create tag:", error);
      }
    }
  };

  const handleDeleteTag = async (tagId: number) => {
    if (user?.id) {
      try {
        await deleteTagMutation.mutateAsync({ tagId, userId: user.id });
      } catch (error) {
        console.error("Failed to delete tag:", error);
      }
    }
  };

  const handleCreateTagType = async () => {
    if (newTagTypeName.trim() && user?.id) {
      try {
        await createTagTypeMutation.mutateAsync({ 
          name: newTagTypeName.trim(), 
          userId: user.id 
        });
        setNewTagTypeName("");
        setCreateTagTypeDialogOpen(false);
      } catch (error) {
        console.error("Failed to create tag type:", error);
      }
    }
  };

  const handleDeleteTagType = async (tagTypeId: number) => {
    if (user?.id) {
      try {
        await deleteTagTypeMutation.mutateAsync({ tagTypeId, userId: user.id });
      } catch (error) {
        console.error("Failed to delete tag type:", error);
      }
    }
  };

  const handleEditTag = (tag: { id: number; name: string }) => {
    setEditingTag(tag);
    setEditingTagName(tag.name);
    setEditDialogOpen(true);
  };

  const handleSaveTag = async () => {
    if (editingTag && editingTagName.trim() && user?.id) {
      try {
        await updateTagMutation.mutateAsync({ 
          tagId: editingTag.id, 
          name: editingTagName.trim(), 
          userId: user.id 
        });
        setEditDialogOpen(false);
        setEditingTag(null);
        setEditingTagName("");
      } catch (error) {
        console.error("Failed to update tag:", error);
      }
    }
  };

  const handleCancelEdit = () => {
    setEditDialogOpen(false);
    setEditingTag(null);
    setEditingTagName("");
  };

  return (
    <AppLayout 
      title="Manage Tags & Types" 
    >
      {/* Tag Types Section */}
      <div className="bg-card border rounded-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center">
            <FolderOpen className="h-5 w-5 mr-2" />
            Your Tag Types
          </h2>
          <Button 
            size="sm"
            onClick={() => setCreateTagTypeDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Tag Type
          </Button>
        </div>
        {tagTypesLoading && <p>Loading tag types...</p>}
        {tagTypesError && <p className="text-red-500">Failed to load tag types.</p>}
        <div className="space-y-4">
          {tagTypes && tagTypes.map((tagType) => (
            <div key={tagType.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <FolderOpen className="h-5 w-5 text-muted-foreground" />
                <div>
                  <h3 className="font-medium">{tagType.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Created {tagType.createdAt.toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDeleteTagType(tagType.id)}
                  disabled={deleteTagTypeMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          {tagTypes && tagTypes.length === 0 && !tagTypesLoading && (
            <p className="text-center text-muted-foreground py-8">
              No tag types created yet. Create your first tag type using the "New Tag Type" button!
            </p>
          )}
        </div>
      </div>

      {/* Tags Section */}
      <div className="bg-card border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center">
            <Tag className="h-5 w-5 mr-2" />
            Your Tags
          </h2>
          <Button 
            size="sm"
            onClick={() => setCreateTagDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Tag
          </Button>
        </div>
        {isLoading && <p>Loading tags...</p>}
        {isError && <p className="text-red-500">Failed to load tags.</p>}
        <div className="space-y-4">
          {tags && tags.map((tag) => (
            <div key={tag.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3 flex-1">
                <Tag className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <h3 
                    className="font-medium cursor-pointer hover:text-primary"
                    onClick={() => handleEditTag(tag)}
                  >
                    {tag.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Created {tag.createdAt.toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEditTag(tag)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDeleteTag(tag.id)}
                  disabled={deleteTagMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          {tags && tags.length === 0 && !isLoading && (
            <p className="text-center text-muted-foreground py-8">
              No tags created yet. Create your first tag using the "New Tag" button!
            </p>
          )}
        </div>
      </div>

      {/* Edit Tag Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Tag</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label htmlFor="editTagName" className="block text-sm font-medium mb-2">
                Tag Name
              </label>
              <Input
                id="editTagName"
                value={editingTagName}
                onChange={(e) => setEditingTagName(e.target.value)}
                placeholder="Enter tag name"
                onKeyDown={(e) => e.key === "Enter" && handleSaveTag()}
                disabled={updateTagMutation.isPending}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={handleCancelEdit}
              disabled={updateTagMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveTag}
              disabled={!editingTagName.trim() || updateTagMutation.isPending}
            >
              {updateTagMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Tag Dialog */}
      <Dialog open={createTagDialogOpen} onOpenChange={setCreateTagDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Tag</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label htmlFor="newTagName" className="block text-sm font-medium mb-2">
                Tag Name
              </label>
              <Input
                id="newTagName"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Enter tag name"
                onKeyDown={(e) => e.key === "Enter" && handleCreateTag()}
                disabled={createTagMutation.isPending}
              />
            </div>
            {createTagMutation.isError && (
              <p className="text-red-500 text-sm">
                Failed to create tag. Please try again.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setCreateTagDialogOpen(false);
                setNewTagName("");
              }}
              disabled={createTagMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateTag}
              disabled={!newTagName.trim() || createTagMutation.isPending}
            >
              {createTagMutation.isPending ? "Creating..." : "Create Tag"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Tag Type Dialog */}
      <Dialog open={createTagTypeDialogOpen} onOpenChange={setCreateTagTypeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Tag Type</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label htmlFor="newTagTypeName" className="block text-sm font-medium mb-2">
                Tag Type Name
              </label>
              <Input
                id="newTagTypeName"
                value={newTagTypeName}
                onChange={(e) => setNewTagTypeName(e.target.value)}
                placeholder="e.g. Area of Focus, Context, Priority"
                onKeyDown={(e) => e.key === "Enter" && handleCreateTagType()}
                disabled={createTagTypeMutation.isPending}
              />
            </div>
            {createTagTypeMutation.isError && (
              <p className="text-red-500 text-sm">
                Failed to create tag type. Please try again.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setCreateTagTypeDialogOpen(false);
                setNewTagTypeName("");
              }}
              disabled={createTagTypeMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateTagType}
              disabled={!newTagTypeName.trim() || createTagTypeMutation.isPending}
            >
              {createTagTypeMutation.isPending ? "Creating..." : "Create Tag Type"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

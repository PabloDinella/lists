import {
  Search,
  Settings,
  FolderArchive,
  Plus,
  Trash2,
  Tag,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import type { Task } from "@/lib/supabase";
import { useNodes } from "@/hooks/use-nodes";
import { supabase } from "@/lib/supabase";
import { useOrdering } from "@/hooks/use-ordering";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { TaskForm } from "./task-form";
import { TaskService } from "@/lib/supabase";

// Other sections
const otherItems = [
  {
    title: "Archive",
    url: "#archive",
    icon: FolderArchive,
  },
  {
    title: "Trash",
    url: "#trash",
    icon: Trash2,
  },
  {
    title: "Search",
    url: "#search",
    icon: Search,
  },
  {
    title: "Manage lists",
    url: "/lists/manage",
    icon: Tag,
  },
  {
    title: "Settings",
    url: "#settings",
    icon: Settings,
  },
];

// Component to display children nodes for a list
function ListSection({ listId, listName, userId }: { listId: number; listName: string; userId: string }) {
  const navigate = useNavigate();
  
  // Fetch children nodes for this list
  const { data: childrenNodes, isLoading: childrenLoading } = useNodes({
    user_id: userId,
    parent_node: listId,
  });
  const { data: childrenOrdering } = useOrdering({
    user_id: userId,
    root_node: listId,
  });

  // derive ordered children per ordering table
  const orderedChildren = useMemo(() => {
    const children = childrenNodes;
    if (!children) return [];
    if (!childrenOrdering?.order?.length) return children;
    const byId = new Map(children.map((c) => [c.id, c] as const));
    const inOrder = childrenOrdering.order
      .map((id) => byId.get(id))
      .filter(Boolean) as typeof children;
    const missing = children.filter((c) => !childrenOrdering.order.includes(c.id));
    return [...inOrder, ...missing];
  }, [childrenNodes, childrenOrdering]);

  return (
    <SidebarGroup key={listId}>
      <SidebarGroupLabel
        className="cursor-pointer"
        onClick={() => navigate(`/lists/${listId}`)}
      >
        {listName}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {childrenLoading ? (
            <SidebarMenuItem>
              <SidebarMenuButton disabled>
                <span className="text-muted-foreground text-sm">Loading...</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ) : orderedChildren.length > 0 ? (
            orderedChildren.map((child) => (
              <SidebarMenuItem key={child.id}>
                <SidebarMenuButton
                  className="cursor-pointer pl-6"
                  onClick={() => navigate(`/lists/${child.id}`)}
                >
                  <span>{child.name}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))
          ) : (
            <SidebarMenuItem>
              <SidebarMenuButton disabled>
                <span className="text-muted-foreground text-sm pl-6">No items</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AppSidebar() {
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [user, setUser] = useState<{ id: string } | null>(null);
  const navigate = useNavigate();

  // Get current user
  useEffect(() => {
    supabase.auth
      .getUser()
      .then(({ data }: { data: { user: { id: string } | null } }) =>
        setUser(data.user)
      );
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event: unknown, session: { user: { id: string } | null } | null) => {
        setUser(session?.user ?? null);
      }
    );
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // Use the lists hook: treat top-level nodes as lists
  const { data: topLevelNodes, isLoading: listsLoading } = useNodes({
    user_id: user?.id,
    parent_node: null,
  });
  const { data: ordering } = useOrdering({
    user_id: user?.id,
    root_node: null,
  });

  // derive ordered lists per ordering table
  const orderedLists = useMemo(() => {
    const lists = topLevelNodes;
    if (!lists) return [];
    if (!ordering?.order?.length) return lists;
    const byId = new Map(lists.map((l) => [l.id, l] as const));
    const inOrder = ordering.order
      .map((id) => byId.get(id))
      .filter(Boolean) as typeof lists;
    const missing = lists.filter((l) => !ordering.order.includes(l.id));
    return [...inOrder, ...missing];
  }, [topLevelNodes, ordering]);

  // Save new task to Supabase and refresh list
  const handleSaveTask = async (
    task: Omit<Task, "id" | "user_id" | "created_at">
  ) => {
    try {
      await TaskService.createTask(task);
    } catch (error) {
      console.error("Failed to create task:", error);
    }
  };

  return (
    <Sidebar>
      <SidebarContent>
        <div className="flex items-center justify-between px-4 py-2">
          <h1 className="text-xl font-bold">GTD Tasks</h1>
        </div>
        <div className="px-3 py-2">
          <Button
            className="w-full justify-start"
            size="sm"
            onClick={() => setTaskFormOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Task
          </Button>
        </div>
        <TaskForm
          open={taskFormOpen}
          onOpenChange={setTaskFormOpen}
          onSave={handleSaveTask}
        />

        {/* Each top-level list as its own section */}
        {listsLoading ? (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton disabled>
                    <span>Loading lists...</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : topLevelNodes && topLevelNodes.length > 0 ? (
          orderedLists.map((list) => (
            <ListSection 
              key={list.id} 
              listId={list.id} 
              listName={list.name} 
              userId={user!.id} 
            />
          ))
        ) : (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton disabled>
                    <span className="text-muted-foreground text-sm">
                      No lists yet
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <Separator className="my-2" />
        <SidebarGroup>
          <SidebarGroupLabel>Other</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {otherItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    {item.url.startsWith("/") ? (
                      <button
                        onClick={() => navigate(item.url)}
                        className="w-full text-left"
                      >
                        <item.icon className="mr-2 h-4 w-4" />
                        <span>{item.title}</span>
                      </button>
                    ) : (
                      <a href={item.url}>
                        <item.icon className="mr-2 h-4 w-4" />
                        <span>{item.title}</span>
                      </a>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

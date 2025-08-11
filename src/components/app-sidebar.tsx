import { 
  Search, 
  Settings, 
  FolderArchive, 
  Plus,
  Trash2,
  List,
  Tag,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { Task } from "@/lib/supabase";
import { useNodes } from "@/hooks/use-nodes";
import { supabase } from "@/lib/supabase";

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

// Areas of focus
const areas = [
  {
    title: "Work",
    url: "#area-work",
  },
  {
    title: "Personal",
    url: "#area-personal",
  },
  {
    title: "Health",
    url: "#area-health",
  },
  {
    title: "Learning",
    url: "#area-learning",
  },
];

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
    url: "/tags/manage",
    icon: Tag,
  },
  {
    title: "Settings",
    url: "#settings",
    icon: Settings,
  },
];

export function AppSidebar() {
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [user, setUser] = useState<{ id: string } | null>(null);
  const navigate = useNavigate();

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

  // Use the lists hook: treat top-level nodes as lists
  const { data: lists, isLoading: listsLoading } = useNodes({ 
    user_id: user?.id, 
    parent_node: null 
  });

  // Save new task to Supabase and refresh list
  const handleSaveTask = async (task: Omit<Task, "id" | "user_id" | "created_at">) => {
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
          <Button className="w-full justify-start" size="sm" onClick={() => setTaskFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Task
          </Button>
        </div>
        <TaskForm open={taskFormOpen} onOpenChange={setTaskFormOpen} onSave={handleSaveTask} />
        <SidebarGroup>
          <div className="flex items-center justify-between">
            <SidebarGroupLabel>Lists</SidebarGroupLabel>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => {
                // Navigate to list management page
                navigate("/lists/manage");
              }}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          <SidebarGroupContent>
            <SidebarMenu>
              {listsLoading ? (
                <SidebarMenuItem>
                  <SidebarMenuButton disabled>
                    <span>Loading lists...</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ) : lists && lists.length > 0 ? (
                lists.map((list) => (
                  <SidebarMenuItem key={list.id}>
                    <SidebarMenuButton asChild>
                      <button 
                        onClick={() => navigate(`/lists/${list.id}`)}
                        className="w-full text-left"
                      >
                        <List className="mr-2 h-4 w-4" />
                        <span>{list.name}</span>
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              ) : (
                <SidebarMenuItem>
                  <SidebarMenuButton disabled>
                    <span className="text-muted-foreground text-sm">No lists yet</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <Separator className="my-2" />
        
        <SidebarGroup>
          <SidebarGroupLabel>Areas of Focus</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {areas.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <Separator className="my-2" />
        
        <SidebarGroup>
          <SidebarGroupLabel>Other</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {otherItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    {item.url.startsWith('/') ? (
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

import { 
  Calendar, 
  Inbox, 
  Search, 
  Settings, 
  ListChecks, 
  CheckCircle, 
  Clock, 
  Calendar as CalendarIcon, 
  FolderArchive, 
  Bookmark,
  Plus,
  Trash2
} from "lucide-react";
import { useState, useEffect } from "react";
import type { Task } from "@/lib/supabase";

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

// GTD Main areas
const mainItems = [
  {
    title: "Inbox",
    url: "#inbox",
    icon: Inbox,
    count: 5,
  },
  {
    title: "Next Actions",
    url: "#next-actions",
    icon: CheckCircle,
  },
  {
    title: "Waiting For",
    url: "#waiting-for",
    icon: Clock,
  },
  {
    title: "Scheduled",
    url: "#scheduled",
    icon: CalendarIcon,
  },
  {
    title: "Someday",
    url: "#someday",
    icon: Bookmark,
  },
  {
    title: "Projects",
    url: "#projects",
    icon: ListChecks,
  },
];

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
    title: "Settings",
    url: "#settings",
    icon: Settings,
  },
];

export function AppSidebar() {
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch tasks from Supabase
  const fetchTasks = async () => {
    setLoading(true);
    const fetched = await TaskService.getTasks();
    setTasks(fetched);
    setLoading(false);
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Save new task to Supabase and refresh list
  const handleSaveTask = async (task: Omit<Task, "id" | "user_id" | "created_at">) => {
    try {
      await TaskService.createTask(task);
      await fetchTasks();
    } catch (error) {
      console.error("Failed to create task:", error);
    }
  };

  // Calculate inbox count from tasks
  const inboxCount = tasks.filter((t) => t.status === "inbox").length;
  const dynamicMainItems = mainItems.map((item) =>
    item.title === "Inbox" ? { ...item, count: inboxCount } : item
  );

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
          <SidebarGroupLabel>Collection</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {dynamicMainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url} className="flex justify-between w-full">
                      <span className="flex items-center">
                        <item.icon className="mr-2 h-4 w-4" />
                        <span>{item.title}</span>
                      </span>
                      {item.count && (
                        <span className="bg-primary/10 text-primary rounded-md px-2 text-xs">
                          {item.count}
                        </span>
                      )}
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
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
                    <a href={item.url}>
                      <item.icon className="mr-2 h-4 w-4" />
                      <span>{item.title}</span>
                    </a>
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

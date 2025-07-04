import { useEffect, useState } from "react";
import { Button } from "./components/ui/button";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "./components/ui/sidebar";
import { AppSidebar } from "./components/app-sidebar";
import { ThemeProvider } from "./components/theme-provider";
import { ModeToggle } from "./components/mode-toggle";
import { Input } from "./components/ui/input";
import { 
  CheckCircle, 
  Plus, 
  Trash2, 
  Clock, 
  Calendar as CalendarIcon, 
  Bookmark, 
  Edit2, 
  MoreHorizontal 
} from "lucide-react";
import { Separator } from "./components/ui/separator";
import { TaskForm } from "./components/task-form";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "./components/ui/dropdown-menu";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./components/ui/tooltip";
import { SignIn } from "./components/sign-in";
import { supabase } from "@/lib/supabase";

// Task interface based on GTD method
interface Task {
  id: string;
  title: string;
  description: string;
  status: "inbox" | "next" | "waiting" | "scheduled" | "someday" | "completed" | "trashed";
  createdAt: Date;
  dueDate?: Date;
  project?: string;
  area?: string;
  tags?: string[];
}

// Mock tasks data
const mockTasks: Task[] = [
  {
    id: "1",
    title: "Review project proposal",
    description: "Go through the latest project proposal and provide feedback",
    status: "inbox",
    createdAt: new Date(),
    project: "Work Review",
    area: "Work"
  },
  {
    id: "2",
    title: "Schedule dentist appointment",
    description: "Call dentist to schedule annual checkup",
    status: "next",
    createdAt: new Date(),
    area: "Health"
  },
  {
    id: "3",
    title: "Buy groceries",
    description: "Get milk, eggs, bread, and vegetables",
    status: "next",
    createdAt: new Date(),
    area: "Personal"
  },
  {
    id: "4",
    title: "Waiting for client feedback",
    description: "Client promised to send feedback by Wednesday",
    status: "waiting",
    createdAt: new Date(),
    project: "Client Project",
    area: "Work"
  },
  {
    id: "5",
    title: "Pay electricity bill",
    description: "Due by the end of the month",
    status: "scheduled",
    createdAt: new Date(),
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    area: "Personal"
  }
];

function App() {
  const [user, setUser] = useState<any>(null);
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [activeView, setActiveView] = useState<string>("inbox");
  const [newTaskTitle, setNewTaskTitle] = useState<string>("");
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | undefined>(undefined);

  // Filter tasks based on active view
  const filteredTasks = tasks.filter(task => {
    // Don't show completed or trashed tasks in regular views
    if (task.status === "completed" || task.status === "trashed") {
      return activeView === "archive" && task.status === "completed" || 
             activeView === "trash" && task.status === "trashed";
    }
    
    if (activeView === "inbox") return task.status === "inbox";
    if (activeView === "next-actions") return task.status === "next";
    if (activeView === "waiting-for") return task.status === "waiting";
    if (activeView === "scheduled") return task.status === "scheduled";
    if (activeView === "someday") return task.status === "someday";
    if (activeView === "projects") {
      return !!task.project;
    }
    if (activeView.startsWith("area-")) {
      const area = activeView.replace("area-", "");
      return task.area?.toLowerCase() === area;
    }
    return true;
  });

  // Create new task
  const createTask = () => {
    if (!newTaskTitle.trim()) return;
    
    const newTask: Task = {
      id: Date.now().toString(),
      title: newTaskTitle,
      description: "",
      status: "inbox",
      createdAt: new Date(),
    };
    
    setTasks([...tasks, newTask]);
    setNewTaskTitle("");
  };

  // Save task (create or update)
  const saveTask = (task: Task) => {
    if (tasks.some(t => t.id === task.id)) {
      // Update existing task
      setTasks(tasks.map(t => t.id === task.id ? task : t));
    } else {
      // Create new task
      setTasks([...tasks, task]);
    }
  };

  // Complete task
  const completeTask = (id: string) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, status: "completed" } : task
    ));
  };

  // Delete task
  const deleteTask = (id: string) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, status: "trashed" } : task
    ));
  };

  // Edit task
  const editTask = (task: Task) => {
    setSelectedTask(task);
    setIsTaskFormOpen(true);
  };

  // Open new task form
  const openNewTaskForm = () => {
    setSelectedTask(undefined);
    setIsTaskFormOpen(true);
  };

  // Update active view based on URL hash
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.substring(1);
      if (hash) setActiveView(hash);
    };

    handleHashChange(); // Set initial view
    window.addEventListener('hashchange', handleHashChange);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  if (!user) {
    return <SignIn />;
  }

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <TooltipProvider>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
              <SidebarTrigger />
              <h1 className="text-xl font-semibold flex-1">
                {activeView === "inbox" && "Inbox"}
                {activeView === "next-actions" && "Next Actions"}
                {activeView === "waiting-for" && "Waiting For"}
                {activeView === "scheduled" && "Scheduled"}
                {activeView === "someday" && "Someday/Maybe"}
                {activeView === "projects" && "Projects"}
                {activeView === "archive" && "Archive"}
                {activeView === "trash" && "Trash"}
                {activeView.startsWith("area-") && `Area: ${activeView.replace("area-", "").charAt(0).toUpperCase() + activeView.replace("area-", "").slice(1)}`}
              </h1>
              <Button variant="outline" onClick={openNewTaskForm}>
                <Plus className="h-4 w-4 mr-2" />
                New Task
              </Button>
              <ModeToggle />
            </header>
            
            <main className="flex-1 overflow-auto p-4">
              {/* Quick Add Task */}
              <div className="flex items-center space-x-2 mb-6">
                <Input
                  placeholder="Add a new task..."
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && createTask()}
                  className="flex-1"
                />
                <Button onClick={createTask}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
              
              {/* Task List */}
              <div className="space-y-2">
                {filteredTasks.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    <p>No tasks found in this view.</p>
                    <p className="text-sm">Add a new task to get started!</p>
                  </div>
                ) : (
                  filteredTasks.map(task => (
                    <div 
                      key={task.id} 
                      className="p-3 border rounded-lg hover:bg-accent transition-colors group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 rounded-full border mt-0.5"
                                onClick={() => completeTask(task.id)}
                              >
                                <CheckCircle className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              Mark as completed
                            </TooltipContent>
                          </Tooltip>
                          
                          <div className="flex-1 space-y-1">
                            <div className="font-medium">{task.title}</div>
                            {task.description && (
                              <p className="text-sm text-muted-foreground">{task.description}</p>
                            )}
                            
                            {/* Task metadata */}
                            <div className="flex flex-wrap gap-2 mt-2">
                              {task.project && (
                                <div className="inline-flex items-center px-2 py-1 rounded-md bg-primary/10 text-xs">
                                  {task.project}
                                </div>
                              )}
                              
                              {task.area && (
                                <div className="inline-flex items-center px-2 py-1 rounded-md bg-secondary/10 text-xs">
                                  {task.area}
                                </div>
                              )}
                              
                              {task.status === "waiting" && (
                                <div className="inline-flex items-center px-2 py-1 rounded-md bg-yellow-500/10 text-yellow-500 text-xs">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Waiting
                                </div>
                              )}
                              
                              {task.status === "scheduled" && task.dueDate && (
                                <div className="inline-flex items-center px-2 py-1 rounded-md bg-blue-500/10 text-blue-500 text-xs">
                                  <CalendarIcon className="h-3 w-3 mr-1" />
                                  {task.dueDate.toLocaleDateString()}
                                </div>
                              )}
                              
                              {task.status === "someday" && (
                                <div className="inline-flex items-center px-2 py-1 rounded-md bg-purple-500/10 text-purple-500 text-xs">
                                  <Bookmark className="h-3 w-3 mr-1" />
                                  Someday
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex opacity-0 group-hover:opacity-100">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => editTask(task)}
                                  className="h-8 w-8"
                                >
                                  <Edit2 className="h-4 w-4 text-muted-foreground" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                Edit task
                              </TooltipContent>
                            </Tooltip>
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                >
                                  <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => completeTask(task.id)}>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Complete
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => editTask(task)}>
                                  <Edit2 className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => deleteTask(task.id)}>
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </main>
            
            {/* Task Form */}
            <TaskForm
              open={isTaskFormOpen}
              onOpenChange={setIsTaskFormOpen}
              task={selectedTask}
              onSave={saveTask}
            />
          </SidebarInset>
        </SidebarProvider>
      </TooltipProvider>
    </ThemeProvider>
  );
}

export default App;

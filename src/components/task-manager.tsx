import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { AppLayout } from "./app-layout";
import { Input } from "./ui/input";
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
import { TaskForm } from "./task-form";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "./ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "./ui/tooltip";
import { SignIn } from "./sign-in";
import {
  fetchTasks,
  createTask as apiCreateTask,
  updateTask as apiUpdateTask,
  completeTask as apiCompleteTask,
  deleteTask as apiDeleteTask,
  Task
} from "@/lib/api";

export function TaskManager() {
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeView, setActiveView] = useState<string>("inbox");
  const [newTaskTitle, setNewTaskTitle] = useState<string>("");
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | undefined>(undefined);

  // Fetch tasks from Supabase
  useEffect(() => {
    if (!user) return;
    fetchTasks(user.id).then(setTasks);
  }, [user]);

  // Filter tasks based on active view
  const filteredTasks = tasks.filter(task => {
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
  const handleCreateTask = async () => {
    if (!newTaskTitle.trim() || !user) return;
    const created = await apiCreateTask({ title: newTaskTitle, userId: user.id });
    if (created) {
      setTasks([created, ...tasks]);
      setNewTaskTitle("");
    }
  };

  // Save task (create or update)
  const handleSaveTask = async (task: Task) => {
    if (tasks.some(t => t.id === task.id)) {
      const updated = await apiUpdateTask(task);
      if (updated) {
        setTasks(tasks.map(t => t.id === task.id ? updated : t));
      }
    } else {
      const created = await apiUpdateTask(task);
      if (created) {
        setTasks([created, ...tasks]);
      }
    }
  };

  // Complete task
  const handleCompleteTask = async (id: string) => {
    const completed = await apiCompleteTask(id);
    if (completed) {
      setTasks(tasks.map(task => task.id === id ? completed : task));
    }
  };

  // Delete (trash) task
  const handleDeleteTask = async (id: string) => {
    const trashed = await apiDeleteTask(id);
    if (trashed) {
      setTasks(tasks.map(task => task.id === id ? trashed : task));
    }
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
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  useEffect(() => {
    import("@/lib/supabase").then(({ supabase }) => {
      supabase.auth.getUser().then(({ data }: { data: { user: { id: string } | null } }) => setUser(data.user));
      const { data: listener } = supabase.auth.onAuthStateChange((_event: unknown, session: { user: { id: string } | null } | null) => {
        setUser(session?.user ?? null);
      });
      return () => {
        listener.subscription.unsubscribe();
      };
    });
  }, []);

  if (!user) {
    return <SignIn />;
  }

  // Get the title for the current view
  const getViewTitle = () => {
    if (activeView === "inbox") return "Inbox";
    if (activeView === "next-actions") return "Next Actions";
    if (activeView === "waiting-for") return "Waiting For";
    if (activeView === "scheduled") return "Scheduled";
    if (activeView === "someday") return "Someday/Maybe";
    if (activeView === "projects") return "Projects";
    if (activeView === "archive") return "Archive";
    if (activeView === "trash") return "Trash";
    if (activeView.startsWith("area-")) {
      return `Area: ${activeView.replace("area-", "").charAt(0).toUpperCase() + activeView.replace("area-", "").slice(1)}`;
    }
    return "Tasks";
  };

  return (
    <AppLayout 
      title={getViewTitle()} 
      onNewItem={openNewTaskForm}
      newItemLabel="New Task"
    >
      {/* Quick Add Task */}
      <div className="flex items-center space-x-2 mb-6">
        <Input
          placeholder="Add a new task..."
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreateTask()}
          className="flex-1"
        />
        <Button onClick={handleCreateTask}>
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
                        onClick={() => handleCompleteTask(task.id)}
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
                        <DropdownMenuItem onClick={() => handleCompleteTask(task.id)}>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Complete
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => editTask(task)}>
                          <Edit2 className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteTask(task.id)}>
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

      {/* Task Form */}
      <TaskForm
        open={isTaskFormOpen}
        onOpenChange={setIsTaskFormOpen}
        task={selectedTask}
        onSave={handleSaveTask}
      />
    </AppLayout>
  );
}

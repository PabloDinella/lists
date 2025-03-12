import React, { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Separator } from "./ui/separator";
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetFooter, 
  SheetHeader, 
  SheetTitle
} from "./ui/sheet";
import { Calendar, Clock, Bookmark, ListChecks, Tag } from "lucide-react";

// Task status types from GTD methodology
type TaskStatus = "inbox" | "next" | "waiting" | "scheduled" | "someday" | "completed" | "trashed";

// Task interface
interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  createdAt: Date;
  dueDate?: Date;
  project?: string;
  area?: string;
  tags?: string[];
}

interface TaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task;
  onSave: (task: Task) => void;
}

export function TaskForm({ open, onOpenChange, task, onSave }: TaskFormProps) {
  // Initialize with task data or defaults
  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [status, setStatus] = useState<TaskStatus>(task?.status || "inbox");
  const [project, setProject] = useState(task?.project || "");
  const [area, setArea] = useState(task?.area || "");

  // Reset form when task changes
  React.useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
      setStatus(task.status);
      setProject(task.project || "");
      setArea(task.area || "");
    } else {
      setTitle("");
      setDescription("");
      setStatus("inbox");
      setProject("");
      setArea("");
    }
  }, [task]);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const updatedTask: Task = {
      id: task?.id || Date.now().toString(),
      title,
      description,
      status,
      createdAt: task?.createdAt || new Date(),
      project: project || undefined,
      area: area || undefined,
    };
    
    onSave(updatedTask);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md w-full">
        <form onSubmit={handleSubmit}>
          <SheetHeader>
            <SheetTitle>{task ? "Edit Task" : "New Task"}</SheetTitle>
            <SheetDescription>
              {task 
                ? "Update your task details below." 
                : "Add a new task to your inbox. You can process it later."}
            </SheetDescription>
          </SheetHeader>
          
          <div className="py-6 space-y-4">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                Task Title
              </label>
              <Input
                id="title"
                placeholder="What needs to be done?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description
              </label>
              <textarea
                id="description"
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Add details about this task..."
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <div className="grid grid-cols-3 gap-2">
                <StatusButton 
                  active={status === "inbox"} 
                  onClick={() => setStatus("inbox")} 
                  icon={<ListChecks className="h-4 w-4 mr-2" />}
                  label="Inbox"
                />
                <StatusButton 
                  active={status === "next"} 
                  onClick={() => setStatus("next")} 
                  icon={<Clock className="h-4 w-4 mr-2" />}
                  label="Next Action"
                />
                <StatusButton 
                  active={status === "waiting"} 
                  onClick={() => setStatus("waiting")} 
                  icon={<Clock className="h-4 w-4 mr-2" />}
                  label="Waiting For"
                />
                <StatusButton 
                  active={status === "scheduled"} 
                  onClick={() => setStatus("scheduled")} 
                  icon={<Calendar className="h-4 w-4 mr-2" />}
                  label="Scheduled"
                />
                <StatusButton 
                  active={status === "someday"} 
                  onClick={() => setStatus("someday")} 
                  icon={<Bookmark className="h-4 w-4 mr-2" />}
                  label="Someday"
                />
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="project" className="text-sm font-medium">
                  Project
                </label>
                <Input
                  id="project"
                  placeholder="Which project does this belong to?"
                  value={project}
                  onChange={(e) => setProject(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="area" className="text-sm font-medium">
                  Area of Focus
                </label>
                <select
                  id="area"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                >
                  <option value="">Select an area</option>
                  <option value="Work">Work</option>
                  <option value="Personal">Personal</option>
                  <option value="Health">Health</option>
                  <option value="Learning">Learning</option>
                </select>
              </div>
            </div>
          </div>
          
          <SheetFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{task ? "Update Task" : "Create Task"}</Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

// Helper component for status selection buttons
interface StatusButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

function StatusButton({ active, onClick, icon, label }: StatusButtonProps) {
  return (
    <Button
      type="button"
      variant={active ? "default" : "outline"}
      size="sm"
      className={`flex items-center justify-start ${active ? 'bg-primary' : ''}`}
      onClick={onClick}
    >
      {icon}
      <span className="text-xs">{label}</span>
    </Button>
  );
}
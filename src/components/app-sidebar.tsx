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
  return (
    <Sidebar>
      <SidebarContent>
        <div className="flex items-center justify-between px-4 py-2">
          <h1 className="text-xl font-bold">GTD Tasks</h1>
        </div>
        <div className="px-3 py-2">
          <Button className="w-full justify-start" size="sm">
            <Plus className="mr-2 h-4 w-4" />
            New Task
          </Button>
        </div>
        <SidebarGroup>
          <SidebarGroupLabel>Collection</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
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

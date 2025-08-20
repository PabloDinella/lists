import { Search, Settings, FolderArchive, Trash2, Tag, LogOut, Upload, ChevronDown, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
import { Separator } from "./ui/separator";
import { TreeNode, useListData } from "./node-view/use-list-data";

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
    title: "Import",
    url: "/import",
    icon: Upload,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
];

// Component to display children nodes for a list
function ListSection({
  listId,
  listName,
  children,
}: {
  listId: number;
  listName: string;
  children: TreeNode[];
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleCollapsed = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleListNameClick = () => {
    // Check if we're already on this list page
    const isCurrentPage = location.pathname === `/lists/${listId}`;
    
    if (isCurrentPage) {
      // If already on this page, toggle collapse/expand
      toggleCollapsed();
    } else {
      // If not on this page, navigate to it
      navigate(`/lists/${listId}`);
    }
  };

  return (
    <SidebarGroup key={listId}>
      <SidebarGroupLabel className="flex items-center cursor-pointer group select-none">
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleCollapsed();
          }}
          className="opacity-80 hover:opacity-100 transition-opacity p-1 -m-1 mr-1"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
        <span onClick={handleListNameClick} className="flex-1 cursor-pointer select-none">
          {listName}
        </span>
      </SidebarGroupLabel>
      {!isCollapsed && (
        <SidebarGroupContent>
          <SidebarMenu>
            {children.length > 0 ? (
              children.map((child) => (
                <SidebarMenuItem key={child.id}>
                  <SidebarMenuButton
                    className="cursor-pointer pl-6 select-none"
                    onClick={() => navigate(`/lists/${child.id}`)}
                  >
                    <span>{child.name}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))
            ) : (
              <SidebarMenuItem>
                <SidebarMenuButton disabled>
                  <span className="text-muted-foreground text-sm pl-6">
                    No items
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
          </SidebarMenu>
        </SidebarGroupContent>
      )}
    </SidebarGroup>
  );
}

export function AppSidebar() {
  const [user, setUser] = useState<{ id: string } | null>(null);
  const navigate = useNavigate();

  // Sign out function
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/sign-in');
  };

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

  // Get all nodes to find second-level items for available parents
  const { hierarchicalTree, isLoading: listsLoading } = useListData({
    userId: user?.id || null,
  });

  const topLevelNodes = hierarchicalTree
    .filter((node) => node.metadata?.type === "root")
    .flatMap((node) => node.children);

  return (
    <Sidebar>
      <SidebarContent className="custom-scrollbar">
        <div className="flex items-center justify-between px-4 py-2">
          <h1 className="text-xl font-bold">trylists.app</h1>
        </div>

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
          topLevelNodes.map((list) => (
            <ListSection
              key={list.id}
              listId={list.id}
              listName={list.name}
              children={list.children}
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
                        className="w-full text-left select-none"
                      >
                        <item.icon className="mr-2 h-4 w-4" />
                        <span>{item.title}</span>
                      </button>
                    ) : (
                      <a href={item.url} className="select-none">
                        <item.icon className="mr-2 h-4 w-4" />
                        <span>{item.title}</span>
                      </a>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left select-none"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

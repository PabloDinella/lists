import {
  Settings,
  Tag,
  LogOut,
  Upload,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Logo } from "@/components/ui/logo";
import { useUpdateNode } from "@/hooks/use-update-node";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";

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
import { TreeNode, useListData } from "./node-view/use-list-data";
import { useAuth } from "@/hooks/use-auth";

// Other sections
const otherItems = [
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
  listNode,
}: {
  listId: number;
  listName: string;
  children: TreeNode[];
  listNode: TreeNode;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const updateNodeMutation = useUpdateNode();
  const { user } = useAuth();
  
  // Initialize collapse state from node's metadata, defaulting to false if not set
  const [isCollapsed, setIsCollapsed] = useState(
    listNode.metadata?.collapsed ?? false
  );

  // Initialize inline rendering state from node's metadata, defaulting to false if not set
  const [renderInline, setRenderInline] = useState(
    listNode.metadata?.renderInline ?? false
  );

  const toggleCollapsed = () => {
    const newCollapsedState = !isCollapsed;
    setIsCollapsed(newCollapsedState);
    
    // Save the collapse state to the node's metadata
    if (user?.id) {
      updateNodeMutation.mutate({
        nodeId: listId,
        userId: user.id,
        metadata: {
          collapsed: newCollapsedState,
        },
      });
    }
  };

  const toggleRenderInline = () => {
    const newRenderInlineState = !renderInline;
    setRenderInline(newRenderInlineState);
    
    // Save the render inline state to the node's metadata
    if (user?.id) {
      updateNodeMutation.mutate({
        nodeId: listId,
        userId: user.id,
        metadata: {
          renderInline: newRenderInlineState,
        },
      });
    }
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
      <SidebarGroupLabel className="group flex cursor-pointer select-none items-center">
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleCollapsed();
          }}
          className="-m-1 mr-1 p-1 opacity-80 transition-opacity hover:opacity-100"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
        <span
          onClick={handleListNameClick}
          className="flex-1 cursor-pointer select-none"
        >
          {listName}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="-m-1 ml-1 p-1 opacity-60 transition-opacity hover:opacity-100">
              <Settings className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuCheckboxItem
              checked={renderInline}
              onCheckedChange={toggleRenderInline}
            >
              Render subitems inline
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarGroupLabel>
      {!isCollapsed && (
        <SidebarGroupContent>
          <SidebarMenu>
            {children.length > 0 ? (
              renderInline ? (
                // Render inline: show all children in a single line with separators, each clickable
                <SidebarMenuItem>
                  <div className="pl-6 py-1.5 flex flex-wrap items-center gap-1">
                    {children.map((child, index) => (
                      <span key={child.id} className="flex items-center">
                        <button
                          onClick={() => navigate(`/lists/${child.id}`)}
                          className="text-sm hover:text-foreground text-muted-foreground hover:underline cursor-pointer"
                        >
                          {child.name}
                        </button>
                        {index < children.length - 1 && (
                          <span className="text-muted-foreground mx-1">•</span>
                        )}
                      </span>
                    ))}
                  </div>
                </SidebarMenuItem>
              ) : (
                // Render normal: show each child as separate menu item
                children.map((child) => (
                  <SidebarMenuItem key={child.id}>
                    <SidebarMenuButton
                      className="cursor-pointer select-none pl-6"
                      onClick={() => navigate(`/lists/${child.id}`)}
                    >
                      <span>{child.name}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              )
            ) : (
              <SidebarMenuItem>
                <SidebarMenuButton disabled>
                  <span className="pl-6 text-sm text-muted-foreground">
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
  const { user } = useAuth();

  const navigate = useNavigate();

  // Sign out function
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/sign-in");
  };

  // Get all nodes to find second-level items for available parents
  const { hierarchicalTree, isLoading: listsLoading } = useListData({
    userId: user?.id || null,
  });

  const topLevelNodes = hierarchicalTree
    .filter((node) => node.metadata?.type === "root")
    .flatMap((node) => node.children);

  return (
    <Sidebar>
      <SidebarContent className="custom-scrollbar flex flex-col">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-2">
            <Logo className="w-6 h-6" />
            <h1 className="text-xl font-bold">trylists.app</h1>
          </div>
        </div>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto">
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
                listNode={list}
              />
            ))
          ) : (
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton disabled>
                      <span className="text-sm text-muted-foreground">
                        No lists yet
                      </span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
        </div>

        {/* Fixed bottom section - always visible */}
        <div className="border-t">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {otherItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      {item.url.startsWith("/") ? (
                        <button
                          onClick={() => navigate(item.url)}
                          className="w-full select-none text-left"
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
                      className="w-full select-none text-left"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign out</span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}

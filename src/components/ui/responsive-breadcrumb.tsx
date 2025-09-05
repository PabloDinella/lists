import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
} from "./breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";

interface BreadcrumbNode {
  id: number;
  name: string;
}

interface ResponsiveBreadcrumbProps {
  breadcrumbPath: BreadcrumbNode[];
  onNavigate: (path: string) => void;
}

export function ResponsiveBreadcrumb({ breadcrumbPath, onNavigate }: ResponsiveBreadcrumbProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleItems, setVisibleItems] = useState<BreadcrumbNode[]>(breadcrumbPath);
  const [hiddenItems, setHiddenItems] = useState<BreadcrumbNode[]>([]);
  const [showEllipsis, setShowEllipsis] = useState(false);

  useEffect(() => {
    const checkOverflow = () => {
      if (!containerRef.current || breadcrumbPath.length <= 2) {
        setVisibleItems(breadcrumbPath);
        setHiddenItems([]);
        setShowEllipsis(false);
        return;
      }

      const container = containerRef.current;
      const containerWidth = container.offsetWidth;
      
      // Create a temporary element to measure the full breadcrumb width
      const tempElement = document.createElement('div');
      tempElement.style.position = 'absolute';
      tempElement.style.visibility = 'hidden';
      tempElement.style.whiteSpace = 'nowrap';
      tempElement.style.fontSize = '14px'; // text-sm
      
      // Build the full breadcrumb text
      const fullText = `Home / ${breadcrumbPath.map(node => node.name).join(' / ')}`;
      tempElement.textContent = fullText;
      
      document.body.appendChild(tempElement);
      const fullWidth = tempElement.offsetWidth;
      document.body.removeChild(tempElement);

      // If the full breadcrumb fits, show all items
      if (fullWidth <= containerWidth) {
        setVisibleItems(breadcrumbPath);
        setHiddenItems([]);
        setShowEllipsis(false);
        return;
      }

      // Calculate how many items we can show
      // Reserve space for "Home / ... / LastItem"
      const homeWidth = 50; // Approximate width of "Home /"
      const ellipsisWidth = 30; // Approximate width of " ... /"
      const separatorWidth = 20; // Approximate width of " /"
      
      let availableWidth = containerWidth - homeWidth - ellipsisWidth - separatorWidth;
      
      // Try to fit the last item
      const lastItem = breadcrumbPath[breadcrumbPath.length - 1];
      const lastItemWidth = Math.min(lastItem.name.length * 8, 200); // Approximate character width
      
      if (lastItemWidth <= availableWidth) {
        // Show only the last item and hide the rest
        setVisibleItems([lastItem]);
        setHiddenItems(breadcrumbPath.slice(0, -1)); // All items except the last one
        setShowEllipsis(true);
      } else {
        // If even the last item doesn't fit, show it truncated
        setVisibleItems([lastItem]);
        setHiddenItems(breadcrumbPath.slice(0, -1));
        setShowEllipsis(true);
      }
    };

    checkOverflow();
    
    const resizeObserver = new ResizeObserver(checkOverflow);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [breadcrumbPath]);

  return (
    <div ref={containerRef} className="overflow-hidden">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink
              className="cursor-pointer"
              onClick={() => onNavigate("/app")}
            >
              Home
            </BreadcrumbLink>
          </BreadcrumbItem>
          
          {showEllipsis && hiddenItems.length > 0 && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex h-9 w-9 items-center justify-center hover:bg-accent hover:text-accent-foreground rounded-sm transition-colors">
                      <BreadcrumbEllipsis />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="min-w-[200px]">
                    {hiddenItems.map((node) => (
                      <DropdownMenuItem
                        key={node.id}
                        onClick={() => onNavigate(`/lists/${node.id}`)}
                        className="cursor-pointer"
                      >
                        {node.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </BreadcrumbItem>
            </>
          )}
          
          {visibleItems.map((node, index) => (
            <React.Fragment key={node.id}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {index === visibleItems.length - 1 ? (
                  <BreadcrumbPage>{node.name}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink
                    className="cursor-pointer"
                    onClick={() => onNavigate(`/lists/${node.id}`)}
                  >
                    {node.name}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}

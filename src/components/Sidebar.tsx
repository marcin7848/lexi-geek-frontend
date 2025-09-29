import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, Home, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isGroupsExpanded, setIsGroupsExpanded] = useState(false);
  const location = useLocation();

  const toggleSidebar = () => setIsOpen(!isOpen);
  const toggleGroups = () => setIsGroupsExpanded(!isGroupsExpanded);

  const isActive = (path: string) => location.pathname === path;

  const groupItems = [
    { name: "Test1", path: "/groups/test1" },
    { name: "Test2", path: "/groups/test2" },
    { name: "Test3", path: "/groups/test3" },
  ];

  return (
    <>
      {/* Sidebar Toggle Button - Always visible */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        className="fixed top-20 left-4 z-50 bg-card border border-border shadow-card"
      >
        <Menu className="h-4 w-4" />
      </Button>

      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed left-0 top-0 h-full bg-sidebar-background border-r border-sidebar-border z-40 transition-transform duration-300",
          isOpen ? "translate-x-0 w-64" : "-translate-x-full w-0"
        )}
      >
        <div className="pt-24 px-4">
          {/* Home Link */}
          <Link
            to="/"
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md transition-colors mb-2",
              isActive("/") 
                ? "bg-sidebar-accent text-sidebar-primary font-medium" 
                : "text-sidebar-foreground hover:bg-sidebar-accent/50"
            )}
          >
            <Home className="h-4 w-4" />
            <span>Home</span>
          </Link>

          {/* Groups Section */}
          <div>
            <button
              onClick={toggleGroups}
              className={cn(
                "flex items-center justify-between w-full px-3 py-2 rounded-md transition-colors",
                "text-sidebar-foreground hover:bg-sidebar-accent/50"
              )}
            >
              <span>Groups</span>
              {isGroupsExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>

            {/* Groups Submenu */}
            {isGroupsExpanded && (
              <div className="ml-4 mt-1 space-y-1">
                {groupItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "block px-3 py-2 rounded-md transition-colors text-sm",
                      isActive(item.path)
                        ? "bg-sidebar-accent text-sidebar-primary font-medium"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent/30"
                    )}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={toggleSidebar}
        />
      )}
    </>
  );
};
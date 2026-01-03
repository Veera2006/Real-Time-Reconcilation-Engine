import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  ArrowLeftRight, 
  AlertTriangle, 
  Clock, 
  FileText, 
  Settings, 
  HelpCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface SidebarProps {
  className?: string;
  activeView: string;
  onNavigate: (view: string) => void;
}

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard' },
  { icon: ArrowLeftRight, label: 'Reconciliation' },
  { icon: AlertTriangle, label: 'Anomalies', badge: 5 },
  { icon: Clock, label: 'Pending', badge: 2 },
  { icon: FileText, label: 'Reports' },
];

const bottomItems = [
  { icon: Settings, label: 'Settings' },
  { icon: HelpCircle, label: 'Help' },
];

export function Sidebar({ className, activeView, onNavigate }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={cn(
      'flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300',
      collapsed ? 'w-16' : 'w-60',
      className
    )}>
      {/* Logo */}
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <ArrowLeftRight className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-sidebar-foreground">ReconEngine</h1>
              <p className="text-[10px] text-sidebar-foreground/60">v2.4.1</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center mx-auto">
            <ArrowLeftRight className="h-4 w-4 text-primary-foreground" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1">
        {menuItems.map((item) => {
          const isActive = activeView === item.label.toLowerCase();
          return (
            <Tooltip key={item.label} delayDuration={0}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onNavigate(item.label.toLowerCase())}
                  className={cn(
                    'flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-primary' 
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground',
                    collapsed && 'justify-center px-2'
                  )}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.badge && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                  {collapsed && item.badge && (
                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[8px] font-bold text-destructive-foreground">
                      {item.badge}
                    </span>
                  )}
                </button>
              </TooltipTrigger>
              {collapsed && (
                <TooltipContent side="right" className="bg-popover border-border">
                  <p>{item.label}</p>
                </TooltipContent>
              )}
            </Tooltip>
          );
        })}
      </nav>

      {/* Bottom Items */}
      <div className="p-2 space-y-1 border-t border-sidebar-border">
        {bottomItems.map((item) => (
          <Tooltip key={item.label} delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                className={cn(
                  'flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground',
                  collapsed && 'justify-center px-2'
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </button>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right" className="bg-popover border-border">
                <p>{item.label}</p>
              </TooltipContent>
            )}
          </Tooltip>
        ))}
        
        <Separator className="my-2 bg-sidebar-border" />
        
        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'flex items-center gap-3 w-full rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            'text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-foreground',
            collapsed && 'justify-center px-2'
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span className="text-xs">Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}

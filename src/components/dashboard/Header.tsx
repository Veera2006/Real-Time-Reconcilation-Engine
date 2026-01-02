import { Bell, Search, User, Play, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface HeaderProps {
  onSimulateLive: () => void;
  isLiveSimulating: boolean;
}

export function Header({ onSimulateLive, isLiveSimulating }: HeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-border bg-card px-6 py-3">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Transaction Reconciliation</h1>
          <p className="text-xs text-muted-foreground">Real-time monitoring • Last sync 2 min ago</p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-success/10 px-3 py-1">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
          </span>
          <span className="text-xs font-medium text-success">Live</span>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Search transactions..." 
            className="w-64 pl-9 bg-secondary/50 border-border focus:bg-secondary"
          />
        </div>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Simulate Live Button */}
        <Button 
          variant="outline" 
          size="sm"
          onClick={onSimulateLive}
          disabled={isLiveSimulating}
          className="border-primary/50 text-primary hover:bg-primary/10"
        >
          {isLiveSimulating ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Simulating...
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              Simulate Live Ingestion
            </>
          )}
        </Button>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                3
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 bg-popover border-border">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex flex-col items-start gap-1 p-3">
              <div className="flex items-center gap-2">
                <Badge variant="destructive" className="text-[10px]">Mismatch</Badge>
                <span className="text-xs text-muted-foreground">2 min ago</span>
              </div>
              <p className="text-sm">Amount mismatch detected: ₹1,200 vs ₹1,150</p>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start gap-1 p-3">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-[10px] bg-warning/20 text-warning">Pending</Badge>
                <span className="text-xs text-muted-foreground">15 min ago</span>
              </div>
              <p className="text-sm">CBS settlement pending for 3 transactions</p>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start gap-1 p-3">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-[10px] bg-success/20 text-success">Resolved</Badge>
                <span className="text-xs text-muted-foreground">1 hour ago</span>
              </div>
              <p className="text-sm">Auto-resolved 12 GST adjustments</p>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-popover border-border">
            <DropdownMenuLabel>
              <div>
                <p className="text-sm font-medium">Audit Admin</p>
                <p className="text-xs text-muted-foreground">admin@hdfc.com</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Preferences</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

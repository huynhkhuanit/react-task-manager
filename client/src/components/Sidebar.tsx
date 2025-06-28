import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/AuthProvider';
import { 
  CheckSquare, 
  Plus, 
  Settings, 
  LogOut, 
  Sun, 
  Moon, 
  BarChart3,
  User,
  Bell
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setIsDarkMode(isDark);
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', newDarkMode.toString());
  };

  // Load dark mode preference on mount
  useEffect(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) {
      const isDark = saved === 'true';
      setIsDarkMode(isDark);
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, []);

  const handleLogout = () => {
    logout();
    onClose();
  };

  const getInitials = (name?: string | null, email?: string) => {
    if (name) {
      return name.split(' ').map(part => part[0]).join('').toUpperCase().slice(0, 2);
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  return (
    <>
      {/* Sidebar */}
      <div className={`
        fixed md:static inset-y-0 left-0 z-50 w-64 
        bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <CheckSquare className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  TaskFlow
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Organize & Conquer
                </p>
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user?.avatar_url || undefined} />
                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                  {getInitials(user?.name, user?.email)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user?.name || 'User'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user?.email}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                Main
              </p>
              <div className="space-y-1">
                <Button variant="ghost" className="w-full justify-start" size="sm">
                  <CheckSquare className="mr-3 h-4 w-4" />
                  Tasks
                  <Badge variant="secondary" className="ml-auto">
                    Active
                  </Badge>
                </Button>
                <Button variant="ghost" className="w-full justify-start" size="sm">
                  <BarChart3 className="mr-3 h-4 w-4" />
                  Analytics
                </Button>
                <Button variant="ghost" className="w-full justify-start" size="sm">
                  <Bell className="mr-3 h-4 w-4" />
                  Notifications
                </Button>
              </div>
            </div>

            <Separator />

            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                Quick Actions
              </p>
              <div className="space-y-1">
                <Button variant="ghost" className="w-full justify-start" size="sm">
                  <Plus className="mr-3 h-4 w-4" />
                  New Task
                </Button>
              </div>
            </div>

            <Separator />

            <div>
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                Settings
              </p>
              <div className="space-y-1">
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  size="sm"
                  onClick={toggleDarkMode}
                >
                  {isDarkMode ? (
                    <Sun className="mr-3 h-4 w-4" />
                  ) : (
                    <Moon className="mr-3 h-4 w-4" />
                  )}
                  {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                </Button>
                <Button variant="ghost" className="w-full justify-start" size="sm">
                  <User className="mr-3 h-4 w-4" />
                  Profile
                </Button>
                <Button variant="ghost" className="w-full justify-start" size="sm">
                  <Settings className="mr-3 h-4 w-4" />
                  Preferences
                </Button>
              </div>
            </div>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="ghost"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
              size="sm"
              onClick={handleLogout}
            >
              <LogOut className="mr-3 h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
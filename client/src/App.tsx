
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { trpc } from '@/utils/trpc';
import { CalendarIcon, Plus, Trash2, Sun, Moon } from 'lucide-react';
import { format } from 'date-fns';
import type { Task, CreateTaskInput, TaskStatus, TaskPriority } from '../../server/src/schema';

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);

  const [formData, setFormData] = useState<CreateTaskInput>({
    title: '',
    description: '',
    due_date: new Date(),
    priority: 'medium',
    status: 'to do'
  });

  const loadTasks = useCallback(async () => {
    try {
      const result = await trpc.tasks.getAll.query();
      setTasks(result);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const newTask = await trpc.tasks.create.mutate(formData);
      setTasks((prev: Task[]) => [...prev, newTask]);
      setFormData({
        title: '',
        description: '',
        due_date: new Date(),
        priority: 'medium',
        status: 'to do'
      });
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await trpc.tasks.delete.mutate({ id: taskId });
      setTasks((prev: Task[]) => prev.filter(task => task.id !== taskId));
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, newStatus: TaskStatus) => {
    e.preventDefault();
    if (!draggedTask || draggedTask.status === newStatus) return;

    try {
      const updatedTask = await trpc.tasks.updateStatus.mutate({
        id: draggedTask.id,
        status: newStatus
      });
      
      setTasks((prev: Task[]) =>
        prev.map(task => task.id === draggedTask.id ? updatedTask : task)
      );
    } catch (error) {
      console.error('Failed to update task status:', error);
    } finally {
      setDraggedTask(null);
    }
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getStatusTasks = (status: TaskStatus) => {
    return tasks.filter(task => task.status === status);
  };

  const columns: { status: TaskStatus; title: string; bgColor: string }[] = [
    { status: 'to do', title: '📋 To Do', bgColor: 'bg-slate-50 dark:bg-slate-900' },
    { status: 'in progress', title: '⚡ In Progress', bgColor: 'bg-blue-50 dark:bg-blue-950' },
    { status: 'done', title: '✅ Done', bgColor: 'bg-green-50 dark:bg-green-950' }
  ];

  return (
    <div className={`min-h-screen transition-colors ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              🚀 Task Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Organize your work with our beautiful Kanban board
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="transition-colors"
            >
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                  <Plus className="w-4 h-4 mr-2" />
                  New Task
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Create New Task</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateTask} className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateTaskInput) => ({ ...prev, title: e.target.value }))
                      }
                      placeholder="Enter task title..."
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setFormData((prev: CreateTaskInput) => ({ ...prev, description: e.target.value }))
                      }
                      placeholder="Describe your task..."
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label>Due Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {format(formData.due_date, 'PPP')}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.due_date}
                          onSelect={(date: Date | undefined) =>
                            date && setFormData((prev: CreateTaskInput) => ({ ...prev, due_date: date }))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <Label>Priority</Label>
                    <Select
                      value={formData.priority || 'medium'}
                      onValueChange={(value: TaskPriority) =>
                        setFormData((prev: CreateTaskInput) => ({ ...prev, priority: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">🟢 Low</SelectItem>
                        <SelectItem value="medium">🟡 Medium</SelectItem>
                        <SelectItem value="high">🔴 High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Status</Label>
                    <Select
                      value={formData.status || 'to do'}
                      onValueChange={(value: TaskStatus) =>
                        setFormData((prev: CreateTaskInput) => ({ ...prev, status: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="to do">📋 To Do</SelectItem>
                        <SelectItem value="in progress">⚡ In Progress</SelectItem>
                        <SelectItem value="done">✅ Done</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? 'Creating...' : 'Create Task'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {columns.map((column) => (
            <div
              key={column.status}
              className={`${column.bgColor} rounded-xl p-4 transition-colors`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.status)}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-lg text-gray-900 dark:text-white">
                  {column.title}
                </h2>
                <Badge variant="secondary" className="bg-white/50 dark:bg-gray-800/50">
                  {getStatusTasks(column.status).length}
                </Badge>
              </div>

              <div className="space-y-3 min-h-[400px]">
                {getStatusTasks(column.status).map((task: Task) => (
                  <Card
                    key={task.id}
                    draggable
                    onDragStart={() => handleDragStart(task)}
                    className="cursor-move hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1 bg-white dark:bg-gray-800 border-0 shadow-sm"
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                          {task.title}
                        </CardTitle>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Task</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{task.title}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteTask(task.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {task.description && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-3">
                          {task.description}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </Badge>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {format(task.due_date, 'MMM dd')}
                        </span>
                      </div>
                      
                      <div className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                        Created {format(task.created_at, 'MMM dd, yyyy')}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {getStatusTasks(column.status).length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <div className="text-4xl mb-2">📝</div>
                    <p className="text-sm">No tasks yet</p>
                    <p className="text-xs">Drag tasks here or create new ones</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Stats Footer */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-white dark:bg-gray-800">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {tasks.length}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Tasks</p>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-gray-800">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {getStatusTasks('in progress').length}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">In Progress</p>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-gray-800">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {getStatusTasks('done').length}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-gray-800">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {tasks.filter(task => task.priority === 'high').length}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">High Priority</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default App;

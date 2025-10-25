import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { dashboardService, type TaskType } from "@/services/dashboardService";
import { RefreshCw, Settings, Star } from "lucide-react";
import { TaskSettingsModal } from "./TaskSettingsModal";

interface DailyTasksProps {
  onStarsUpdate: () => void;
}

export const DailyTasks = ({ onStarsUpdate }: DailyTasksProps) => {
  const [tasks, setTasks] = useState<TaskType[]>([]);
  const [loading, setLoading] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    const data = await dashboardService.getDailyTasks();
    setTasks(data);
  };

  const handleReload = async () => {
    setLoading(true);
    const newTasks = await dashboardService.generateTasks();
    setTasks(newTasks);
    setLoading(false);
  };

  const getTaskLabel = (type: string) => {
    switch (type) {
      case 'repeat_dictionary': return 'Repeat Dictionary Words';
      case 'repeat_exercise': return 'Repeat Exercise Words';
      case 'add_dictionary': return 'Add New Dictionary Words';
      case 'add_exercise': return 'Add New Exercise Words';
      default: return type;
    }
  };

  const handleSettingsSaved = () => {
    loadTasks();
    onStarsUpdate();
  };

  return (
    <>
      <Card className="shadow-card border-border/50 h-[480px] flex flex-col">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-primary">Tasks</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReload}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Reload
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSettingsOpen(true)}
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden">
          {tasks.length === 0 ? (
            <p className="text-muted-foreground text-sm">No tasks for today</p>
          ) : (
            <ScrollArea className="h-full pr-4">
              <div className="space-y-4">
                {tasks.map(task => (
                  <div key={task.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{task.languageName}</span>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-sm text-muted-foreground">{getTaskLabel(task.type)}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">
                            {task.current} / {task.maximum}
                          </span>
                          <div className="flex items-center gap-1 text-xs text-amber-500">
                            <Star className="w-3 h-3 fill-current" />
                            <span>{task.starsReward}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <Progress value={(task.current / task.maximum) * 100} />
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <TaskSettingsModal
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        onSaved={handleSettingsSaved}
      />
    </>
  );
};

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { dashboardService, type TaskType } from "@/services/dashboardService";
import { useStars } from "@/contexts/StarsContext";
import { RefreshCw, Settings, Star } from "lucide-react";
import { TaskSettingsModal } from "./TaskSettingsModal";
import { useLanguage } from "@/i18n/LanguageProvider";

export const DailyTasks = () => {
  const [tasks, setTasks] = useState<TaskType[]>([]);
  const [loading, setLoading] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { refreshStars } = useStars();
  const { t } = useLanguage();

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
      case 'repeat_dictionary': return t("dashboard.repeatDictionary");
      case 'repeat_exercise': return t("dashboard.repeatExercise");
      case 'add_dictionary': return t("dashboard.addDictionary");
      case 'add_exercise': return t("dashboard.addExercise");
      default: return type;
    }
  };

  const handleSettingsSaved = () => {
    loadTasks();
    refreshStars();
  };

  return (
    <>
      <Card className="shadow-card border-border/50 h-[480px] flex flex-col">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-primary">{t("dashboard.tasks")}</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReload}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                {t("dashboard.reload")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSettingsOpen(true)}
              >
                <Settings className="w-4 h-4 mr-2" />
                {t("dashboard.settings")}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden">
          {tasks.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t("dashboard.noTasks")}</p>
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

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { activityService, type Activity } from "@/services/activityService";
import { Clock, CheckCircle2, Star } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";

export const RecentActivitySection = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    try {
      setIsLoading(true);
      const data = await activityService.getRecentActivities(10);
      setActivities(data);
    } catch (error) {
      console.error('Failed to load activities:', error);
      setActivities([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getTaskLabel = (taskType: string) => {
    // Convert backend format (REPEAT_DICTIONARY) to frontend format (repeat_dictionary)
    const type = taskType.toLowerCase();
    switch (type) {
      case 'repeat_dictionary': return t("dashboard.repeatDictionary");
      case 'repeat_exercise': return t("dashboard.repeatExercise");
      case 'add_dictionary': return t("dashboard.addDictionary");
      case 'add_exercise': return t("dashboard.addExercise");
      default: return taskType;
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <Card className="shadow-card border-border/50 h-[480px] flex flex-col">
      <CardHeader>
        <CardTitle className="text-primary flex items-center gap-2">
          <Clock className="w-5 h-5" />
          {t("dashboard.recentActivity")}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        {isLoading ? (
          <p className="text-muted-foreground text-sm p-6">{t("dashboard.loading")}</p>
        ) : activities.length === 0 ? (
          <p className="text-muted-foreground text-sm p-6">{t("dashboard.noActivity")}</p>
        ) : (
          <ScrollArea className="h-full px-6">
            <div className="space-y-3 py-2">
              {activities.map(activity => (
                <div key={activity.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  {activity.type === 'REPEATING_FINISHED' ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  ) : (
                    <Star className="w-5 h-5 text-yellow-500 fill-current mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{activity.languageName}</span>
                      {activity.title && (
                        <>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-sm text-muted-foreground">
                            {activity.type === 'STARS_ADDED' ? getTaskLabel(activity.title) : activity.title}
                          </span>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {activity.type === 'REPEATING_FINISHED'
                        ? t("dashboard.repeated")
                        : `${t("dashboard.added")} ${activity.param} ${t("dashboard.stars").toLowerCase()}`}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatTime(activity.created)}
                  </span>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

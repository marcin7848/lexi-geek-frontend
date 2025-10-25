import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { dashboardService, type RecentActivity } from "@/services/dashboardService";
import { Clock } from "lucide-react";

export const RecentActivitySection = () => {
  const [activities, setActivities] = useState<RecentActivity[]>([]);

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    const data = await dashboardService.getRecentActivity();
    setActivities(data.slice(0, 10)); // Show last 10
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
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        {activities.length === 0 ? (
          <p className="text-muted-foreground text-sm p-6">No recent activity</p>
        ) : (
          <ScrollArea className="h-full px-6">
            <div className="space-y-3 py-2">
              {activities.map(activity => (
                <div key={activity.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{activity.languageName}</span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-sm text-muted-foreground">{activity.categoryName}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {activity.type === 'repeat' ? 'Repeated words' : 'Added new words'}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatTime(activity.timestamp)}
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

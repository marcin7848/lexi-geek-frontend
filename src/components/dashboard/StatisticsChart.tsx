import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { statisticsService } from "@/services/statisticsService";
import type { UserStat } from "@/services/statisticsService";
import { languageService, type Language } from "@/services/languageService";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Calendar } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";

export const StatisticsChart = () => {
  const [stats, setStats] = useState<UserStat[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [showTotal, setShowTotal] = useState(true);
  const [showStars, setShowStars] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();

  const loadStatistics = useCallback(async () => {
    setLoading(true);
    try {
      const statsData = await statisticsService.getUserStatistics({
        startDate: startDate,
        endDate: endDate,
        languageUuids: selectedLanguages.length > 0 ? selectedLanguages : undefined,
        showTotal,
        showStars,
      });
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load statistics:', error);
      setStats([]);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, selectedLanguages, showTotal, showStars]);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const langsData = await languageService.getAll();
        setLanguages(langsData);

        // Set default date range (last 30 days)
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 30);

        const endDateStr = end.toISOString().split('T')[0];
        const startDateStr = start.toISOString().split('T')[0];

        setEndDate(endDateStr);
        setStartDate(startDateStr);
      } catch (error) {
        console.error('Failed to load initial data:', error);
      }
    };

    loadInitialData();
  }, []); // Only run once on mount

  useEffect(() => {
    if (startDate && endDate) {
      loadStatistics();
    }
  }, [startDate, endDate, selectedLanguages, showTotal, showStars, loadStatistics]);

  const toggleLanguage = (langId: string) => {
    setSelectedLanguages(prev => 
      prev.includes(langId) 
        ? prev.filter(id => id !== langId)
        : [...prev, langId]
    );
  };

  const chartData = stats.map(stat => {
    const dataPoint: Record<string, string | number> = {
      date: new Date(stat.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    };

    if (showTotal) {
      dataPoint[t("dashboard.totalRepeated")] = stat.repeat;
      dataPoint[t("dashboard.totalAdded")] = stat.add;
    }

    if (showStars) {
      dataPoint[t("dashboard.stars")] = stat.stars;
    }

    // Ensure all selected languages have data points (even if 0) to connect lines
    selectedLanguages.forEach(langId => {
      const lang = languages.find(l => l.id === langId);
      if (lang) {
        const ls = stat.languageStats[langId];
        if (ls) {
          dataPoint[`${lang.name} (${t("dashboard.repeated")})`] = ls.repeat;
          dataPoint[`${lang.name} (${t("dashboard.added")})`] = ls.add;
        } else {
          // If no data for this language on this date, use 0 to keep line connected
          dataPoint[`${lang.name} (${t("dashboard.repeated")})`] = 0;
          dataPoint[`${lang.name} (${t("dashboard.added")})`] = 0;
        }
      }
    });

    return dataPoint;
  });

  const colors = [
    '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6',
    '#ef4444', '#06b6d4', '#84cc16', '#f97316', '#a855f7'
  ];

  return (
    <Card className="shadow-card border-border/50">
      <CardHeader>
        <CardTitle className="text-primary flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          {t("dashboard.statistics")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <Label>{t("dashboard.startDate")}</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("dashboard.endDate")}</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            {loading && (
              <div className="text-sm text-muted-foreground">{t("dashboard.loading")}</div>
            )}
          </div>

          {/* Series Selection */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={showTotal}
                onCheckedChange={(checked) => setShowTotal(checked as boolean)}
              />
              <Label>{t("dashboard.showTotal")}</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={showStars}
                onCheckedChange={(checked) => setShowStars(checked as boolean)}
              />
              <Label>{t("dashboard.showStars")}</Label>
            </div>
            {languages.map(lang => (
              <div key={lang.id} className="flex items-center gap-2">
                <Checkbox
                  checked={selectedLanguages.includes(lang.id)}
                  onCheckedChange={() => toggleLanguage(lang.id)}
                />
                <Label>{lang.name}</Label>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div className="w-full h-[400px] mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                
                {showTotal && (
                  <>
                    <Line 
                      type="monotone" 
                      dataKey={t("dashboard.totalRepeated")}
                      stroke={colors[0]}
                      strokeWidth={2}
                      dot={{ fill: colors[0] }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey={t("dashboard.totalAdded")}
                      stroke={colors[1]}
                      strokeWidth={2}
                      dot={{ fill: colors[1] }}
                    />
                  </>
                )}
                
                {showStars && (
                  <Line 
                    type="monotone" 
                    dataKey={t("dashboard.stars")}
                    stroke="#fbbf24"
                    strokeWidth={2}
                    dot={{ fill: '#fbbf24' }}
                  />
                )}

                {selectedLanguages.map((langId, idx) => {
                  const lang = languages.find(l => l.id === langId);
                  if (!lang) return null;
                  
                  return (
                    <Line
                      key={`${langId}-repeated`}
                      type="monotone"
                      dataKey={`${lang.name} (${t("dashboard.repeated")})`}
                      stroke={colors[(idx * 2 + 2) % colors.length]}
                      strokeWidth={2}
                      dot={{ fill: colors[(idx * 2 + 2) % colors.length] }}
                    />
                  );
                })}
                
                {selectedLanguages.map((langId, idx) => {
                  const lang = languages.find(l => l.id === langId);
                  if (!lang) return null;
                  
                  return (
                    <Line
                      key={`${langId}-added`}
                      type="monotone"
                      dataKey={`${lang.name} (${t("dashboard.added")})`}
                      stroke={colors[(idx * 2 + 3) % colors.length]}
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ fill: colors[(idx * 2 + 3) % colors.length] }}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

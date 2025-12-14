import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { statisticsService, type UserStat } from "@/services/statisticsService";
import { languageService, type Language } from "@/services/languageService";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Calendar } from "lucide-react";

export const StatisticsChart = () => {
  const [stats, setStats] = useState<UserStat[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [showTotal, setShowTotal] = useState(true);
  const [showStars, setShowStars] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);

  const loadStatistics = useCallback(async (customStartDate?: string, customEndDate?: string) => {
    setLoading(true);
    try {
      const statsData = await statisticsService.getUserStatistics({
        startDate: customStartDate || startDate,
        endDate: customEndDate || endDate,
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

  const loadInitialData = useCallback(async () => {
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

      // Load statistics with default date range
      await loadStatistics(startDateStr, endDateStr);
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  }, [loadStatistics]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

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
      dataPoint['Total Repeated'] = stat.repeatDictionary + stat.repeatExercise;
      dataPoint['Total Added'] = stat.addDictionary + stat.addExercise;
    }

    if (showStars) {
      dataPoint['Stars'] = stat.stars;
    }

    selectedLanguages.forEach(langId => {
      const lang = languages.find(l => l.id === langId);
      if (lang && stat.languageBreakdown[langId]) {
        const lb = stat.languageBreakdown[langId];
        dataPoint[`${lang.name} (Repeated)`] = lb.repeatDictionary + lb.repeatExercise;
        dataPoint[`${lang.name} (Added)`] = lb.addDictionary + lb.addExercise;
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
          Statistics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            {loading && (
              <div className="text-sm text-muted-foreground">Loading...</div>
            )}
          </div>

          {/* Series Selection */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={showTotal}
                onCheckedChange={(checked) => setShowTotal(checked as boolean)}
              />
              <Label>Show Total</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={showStars}
                onCheckedChange={(checked) => setShowStars(checked as boolean)}
              />
              <Label>Show Stars</Label>
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
                      dataKey="Total Repeated" 
                      stroke={colors[0]} 
                      strokeWidth={2}
                      dot={{ fill: colors[0] }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="Total Added" 
                      stroke={colors[1]} 
                      strokeWidth={2}
                      dot={{ fill: colors[1] }}
                    />
                  </>
                )}
                
                {showStars && (
                  <Line 
                    type="monotone" 
                    dataKey="Stars" 
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
                      dataKey={`${lang.name} (Repeated)`}
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
                      dataKey={`${lang.name} (Added)`}
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

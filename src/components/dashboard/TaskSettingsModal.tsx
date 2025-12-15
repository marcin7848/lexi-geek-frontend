import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { dashboardService, type TaskSettings, type TaskSchedule } from "@/services/dashboardService";
import { languageService, type Language } from "@/services/languageService";
import { toast } from "sonner";
import { useLanguage } from "@/i18n/LanguageProvider";

interface TaskSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export const TaskSettingsModal = ({ open, onOpenChange, onSaved }: TaskSettingsModalProps) => {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [settings, setSettings] = useState<TaskSettings[]>([]);
  const [schedule, setSchedule] = useState<TaskSchedule>({
    hour: 0,
    minute: 0,
    frequency: 'daily'
  });
  const { t } = useLanguage();

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    try {
      const langs = await languageService.getAll();
      const taskSettings = await dashboardService.getTaskSettings();
      const taskSchedule = await dashboardService.getTaskSchedule();

      // Create default settings for languages that don't have settings
      const settingsMap = new Map(taskSettings.map(s => [s.languageId, s]));
      const completeSettings: TaskSettings[] = langs.map(lang => {
        if (settingsMap.has(lang.id)) {
          return settingsMap.get(lang.id)!;
        }
        // Create default settings for this language
        return {
          languageId: lang.id,
          repeat_dictionary: { enabled: true, maximum: 10 },
          repeat_exercise: { enabled: true, maximum: 10 },
          add_dictionary: { enabled: true, maximum: 5 },
          add_exercise: { enabled: true, maximum: 5 },
        };
      });

      setLanguages(langs);
      setSettings(completeSettings);
      setSchedule(taskSchedule);
    } catch (error) {
      console.error('Error loading task settings:', error);
      toast.error(t("dashboard.errorLoading"));
    }
  };

  const updateSetting = (
    langId: string,
    taskType: 'repeat_dictionary' | 'repeat_exercise' | 'add_dictionary' | 'add_exercise',
    field: 'enabled' | 'maximum',
    value: boolean | number
  ) => {
    setSettings(prev => prev.map(s => {
      if (s.languageId === langId) {
        return {
          ...s,
          [taskType]: {
            ...s[taskType],
            [field]: value
          }
        };
      }
      return s;
    }));
  };

  const handleSave = async () => {
    await dashboardService.updateTaskSettings(settings);
    await dashboardService.updateTaskSchedule(schedule);
    toast.success(t("dashboard.settingsSaved"));
    onSaved();
    onOpenChange(false);
  };

  const taskTypes = [
    { key: 'repeat_dictionary' as const, label: t("dashboard.repeatDictionaryShort") },
    { key: 'repeat_exercise' as const, label: t("dashboard.repeatExerciseShort") },
    { key: 'add_dictionary' as const, label: t("dashboard.addDictionaryShort") },
    { key: 'add_exercise' as const, label: t("dashboard.addExerciseShort") }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("dashboard.taskSettings")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Schedule Settings */}
          <div className="space-y-4">
            <h3 className="font-semibold">{t("dashboard.reloadSchedule")}</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("dashboard.frequency")}</Label>
                <Select
                  value={schedule.frequency}
                  onValueChange={(value) => setSchedule({ ...schedule, frequency: value as TaskSchedule['frequency'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">{t("dashboard.daily")}</SelectItem>
                    <SelectItem value="every_n_days">{t("dashboard.everyNDays")}</SelectItem>
                    <SelectItem value="weekly">{t("dashboard.weekly")}</SelectItem>
                    <SelectItem value="monthly">{t("dashboard.monthly")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {schedule.frequency === 'every_n_days' && (
                <div className="space-y-2">
                  <Label>{t("dashboard.numberOfDays")}</Label>
                  <Input
                    type="number"
                    min="1"
                    value={schedule.frequencyValue || 1}
                    onChange={(e) => setSchedule({ ...schedule, frequencyValue: parseInt(e.target.value) })}
                  />
                </div>
              )}

              {schedule.frequency === 'weekly' && (
                <div className="space-y-2">
                  <Label>{t("dashboard.dayOfWeek")}</Label>
                  <Select
                    value={schedule.frequencyValue?.toString() || '1'}
                    onValueChange={(value) => setSchedule({ ...schedule, frequencyValue: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">{t("dashboard.monday")}</SelectItem>
                      <SelectItem value="2">{t("dashboard.tuesday")}</SelectItem>
                      <SelectItem value="3">{t("dashboard.wednesday")}</SelectItem>
                      <SelectItem value="4">{t("dashboard.thursday")}</SelectItem>
                      <SelectItem value="5">{t("dashboard.friday")}</SelectItem>
                      <SelectItem value="6">{t("dashboard.saturday")}</SelectItem>
                      <SelectItem value="7">{t("dashboard.sunday")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {schedule.frequency === 'monthly' && (
                <div className="space-y-2">
                  <Label>{t("dashboard.dayOfMonth")}</Label>
                  <Input
                    type="number"
                    min="1"
                    max="31"
                    value={schedule.frequencyValue || 1}
                    onChange={(e) => setSchedule({ ...schedule, frequencyValue: parseInt(e.target.value) })}
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("dashboard.hour")}</Label>
                <Input
                  type="number"
                  min="0"
                  max="23"
                  value={schedule.hour}
                  onChange={(e) => setSchedule({ ...schedule, hour: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("dashboard.minute")}</Label>
                <Input
                  type="number"
                  min="0"
                  max="59"
                  value={schedule.minute}
                  onChange={(e) => setSchedule({ ...schedule, minute: parseInt(e.target.value) })}
                />
              </div>
            </div>
          </div>

          {/* Task Settings per Language */}
          <div className="space-y-4">
            <h3 className="font-semibold">{t("dashboard.taskLimitsPerLanguage")}</h3>

            {languages.length === 0 ? (
              <p className="text-muted-foreground text-sm">{t("dashboard.noLanguages")}</p>
            ) : (
              languages.map(lang => {
                const langSettings = settings.find(s => s.languageId === lang.id);
                if (!langSettings) return null;

                return (
                  <div key={lang.id} className="border rounded-lg p-4 space-y-3">
                    <h4 className="font-medium">{lang.name}</h4>

                    {taskTypes.map(({ key, label }) => (
                      <div key={key} className="flex items-center gap-4">
                        <Checkbox
                          checked={langSettings[key].enabled}
                          onCheckedChange={(checked) =>
                            updateSetting(lang.id, key, 'enabled', checked as boolean)
                          }
                        />
                        <Label className="flex-1">{label}</Label>
                        <Input
                          type="number"
                          min="1"
                          className="w-24"
                          disabled={!langSettings[key].enabled}
                          value={langSettings[key].maximum}
                          onChange={(e) =>
                            updateSetting(lang.id, key, 'maximum', parseInt(e.target.value) || 1)
                          }
                        />
                      </div>
                    ))}
                  </div>
                );
              })
            )}
          </div>

          <Button onClick={handleSave} className="w-full">
            {t("dashboard.saveSettings")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

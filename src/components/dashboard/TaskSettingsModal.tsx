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
      toast.error('Failed to load task settings');
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
    toast.success("Task settings saved");
    onSaved();
    onOpenChange(false);
  };

  const taskTypes = [
    { key: 'repeat_dictionary' as const, label: 'Repeat Dictionary' },
    { key: 'repeat_exercise' as const, label: 'Repeat Exercise' },
    { key: 'add_dictionary' as const, label: 'Add Dictionary' },
    { key: 'add_exercise' as const, label: 'Add Exercise' }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Task Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Schedule Settings */}
          <div className="space-y-4">
            <h3 className="font-semibold">Reload Schedule</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Frequency</Label>
                <Select
                  value={schedule.frequency}
                  onValueChange={(value) => setSchedule({ ...schedule, frequency: value as TaskSchedule['frequency'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="every_n_days">Every N Days</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {schedule.frequency === 'every_n_days' && (
                <div className="space-y-2">
                  <Label>Number of Days</Label>
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
                  <Label>Day of Week</Label>
                  <Select
                    value={schedule.frequencyValue?.toString() || '1'}
                    onValueChange={(value) => setSchedule({ ...schedule, frequencyValue: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Monday</SelectItem>
                      <SelectItem value="2">Tuesday</SelectItem>
                      <SelectItem value="3">Wednesday</SelectItem>
                      <SelectItem value="4">Thursday</SelectItem>
                      <SelectItem value="5">Friday</SelectItem>
                      <SelectItem value="6">Saturday</SelectItem>
                      <SelectItem value="7">Sunday</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {schedule.frequency === 'monthly' && (
                <div className="space-y-2">
                  <Label>Day of Month</Label>
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
                <Label>Hour (0-23)</Label>
                <Input
                  type="number"
                  min="0"
                  max="23"
                  value={schedule.hour}
                  onChange={(e) => setSchedule({ ...schedule, hour: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Minute (0-59)</Label>
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
            <h3 className="font-semibold">Task Limits per Language</h3>
            
            {languages.length === 0 ? (
              <p className="text-muted-foreground text-sm">No languages found. Please add a language first.</p>
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
            Save Settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

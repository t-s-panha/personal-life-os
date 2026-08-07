"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Sun, Moon, BookOpen, Lightbulb, Heart, Star, Trash2, Search, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

const JOURNAL_TYPES = [
  { value: "DAILY", label: "Daily", icon: BookOpen, color: "text-blue-500" },
  { value: "STUDY", label: "Study", icon: BookOpen, color: "text-purple-500" },
  { value: "WORK", label: "Work", icon: BookOpen, color: "text-orange-500" },
  { value: "IDEAS", label: "Ideas", icon: Lightbulb, color: "text-yellow-500" },
  { value: "REFLECTION", label: "Reflection", icon: BookOpen, color: "text-indigo-500" },
  { value: "GRATITUDE", label: "Gratitude", icon: Heart, color: "text-pink-500" },
  { value: "LESSONS", label: "Lessons", icon: Star, color: "text-green-500" },
];

interface JournalEntry {
  id: string;
  date: string;
  type: string;
  title: string | null;
  content: string;
  tags: string[];
  mood: number | null;
  energy: number | null;
}

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [checkInType, setCheckInType] = useState<"morning" | "evening">("morning");

  const [form, setForm] = useState({
    type: "DAILY", title: "", content: "", tags: "", mood: "", energy: "",
  });

  const [morningForm, setMorningForm] = useState({
    sleepDuration: "", sleepQuality: "7", energy: "7", motivation: "7", morningMood: "7",
    topPriority: "", topTasks: "", distractions: "",
  });

  const [eveningForm, setEveningForm] = useState({
    completedTasks: "", missedTasks: "", missedReason: "", productivity: "7",
    focusTime: "", wastedTime: "", eveningMood: "7", eveningEnergy: "7",
    stress: "5", discipline: "7", wentWell: "", wentBadly: "", learned: "", improveTomorrow: "", journal: "",
  });

  const fetchEntries = useCallback(async () => {
    const params = new URLSearchParams();
    if (filter !== "ALL") params.append("type", filter);
    if (search) params.append("search", search);
    const res = await fetch(`/api/journal-entries?${params}`);
    setEntries(await res.json());
    setLoading(false);
  }, [filter, search]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/journal-entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: new Date().toISOString(),
        type: form.type,
        title: form.title || null,
        content: form.content,
        tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
        mood: form.mood ? Number(form.mood) : null,
        energy: form.energy ? Number(form.energy) : null,
      }),
    });
    setIsDialogOpen(false);
    setForm({ type: "DAILY", title: "", content: "", tags: "", mood: "", energy: "" });
    fetchEntries();
  };

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const body: any = { date: new Date().toISOString() };

    if (checkInType === "morning") {
      Object.assign(body, {
        sleepDuration: morningForm.sleepDuration ? Number(morningForm.sleepDuration) : null,
        sleepQuality: Number(morningForm.sleepQuality),
        energy: Number(morningForm.energy),
        motivation: Number(morningForm.motivation),
        morningMood: Number(morningForm.morningMood),
        topPriority: morningForm.topPriority || null,
        topTasks: morningForm.topTasks || null,
        distractions: morningForm.distractions || null,
      });
    } else {
      Object.assign(body, {
        completedTasks: eveningForm.completedTasks ? Number(eveningForm.completedTasks) : null,
        missedTasks: eveningForm.missedTasks ? Number(eveningForm.missedTasks) : null,
        missedReason: eveningForm.missedReason || null,
        productivity: Number(eveningForm.productivity),
        focusTime: eveningForm.focusTime ? Number(eveningForm.focusTime) : null,
        wastedTime: eveningForm.wastedTime ? Number(eveningForm.wastedTime) : null,
        eveningMood: Number(eveningForm.eveningMood),
        eveningEnergy: Number(eveningForm.eveningEnergy),
        stress: Number(eveningForm.stress),
        discipline: Number(eveningForm.discipline),
        wentWell: eveningForm.wentWell || null,
        wentBadly: eveningForm.wentBadly || null,
        learned: eveningForm.learned || null,
        improveTomorrow: eveningForm.improveTomorrow || null,
        journal: eveningForm.journal || null,
      });
    }

    await fetch("/api/daily-reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setIsCheckInOpen(false);
    fetchEntries();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this entry?")) return;
    await fetch(`/api/journal-entries?id=${id}`, { method: "DELETE" });
    fetchEntries();
  };

  const getTypeIcon = (type: string) => {
    const t = JOURNAL_TYPES.find(j => j.value === type);
    return t || JOURNAL_TYPES[0];
  };

  if (loading) return <div className="flex items-center justify-center h-full">Loading journal...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Journal</h1>
          <p className="text-muted-foreground">Reflect, learn, grow</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCheckInOpen} onOpenChange={setIsCheckInOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={() => setCheckInType("morning")}>
                <Sun className="w-4 h-4 mr-2" /> Check-in
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Daily Check-in</DialogTitle>
              </DialogHeader>
              <div className="flex gap-2 mb-4">
                <Button variant={checkInType === "morning" ? "default" : "outline"} size="sm" onClick={() => setCheckInType("morning")}>
                  <Sun className="w-4 h-4 mr-1" /> Morning
                </Button>
                <Button variant={checkInType === "evening" ? "default" : "outline"} size="sm" onClick={() => setCheckInType("evening")}>
                  <Moon className="w-4 h-4 mr-1" /> Evening
                </Button>
              </div>
              <form onSubmit={handleCheckIn} className="space-y-4">
                {checkInType === "morning" ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <Input type="number" step="0.1" placeholder="Sleep hours" value={morningForm.sleepDuration} onChange={e => setMorningForm({...morningForm, sleepDuration: e.target.value})} />
                      <div><label className="text-xs text-muted-foreground">Sleep Quality</label><Select value={morningForm.sleepQuality} onChange={e => setMorningForm({...morningForm, sleepQuality: e.target.value})}>{Array.from({length:10},(_,i)=><option key={i+1} value={i+1}>{i+1}</option>)}</Select></div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div><label className="text-xs text-muted-foreground">Energy</label><Select value={morningForm.energy} onChange={e => setMorningForm({...morningForm, energy: e.target.value})}>{Array.from({length:10},(_,i)=><option key={i+1} value={i+1}>{i+1}</option>)}</Select></div>
                      <div><label className="text-xs text-muted-foreground">Motivation</label><Select value={morningForm.motivation} onChange={e => setMorningForm({...morningForm, motivation: e.target.value})}>{Array.from({length:10},(_,i)=><option key={i+1} value={i+1}>{i+1}</option>)}</Select></div>
                      <div><label className="text-xs text-muted-foreground">Mood</label><Select value={morningForm.morningMood} onChange={e => setMorningForm({...morningForm, morningMood: e.target.value})}>{Array.from({length:10},(_,i)=><option key={i+1} value={i+1}>{i+1}</option>)}</Select></div>
                    </div>
                    <Input placeholder="Top priority today" value={morningForm.topPriority} onChange={e => setMorningForm({...morningForm, topPriority: e.target.value})} />
                    <Input placeholder="Top 3 tasks (comma separated)" value={morningForm.topTasks} onChange={e => setMorningForm({...morningForm, topTasks: e.target.value})} />
                    <Input placeholder="Potential distractions" value={morningForm.distractions} onChange={e => setMorningForm({...morningForm, distractions: e.target.value})} />
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-3 gap-4">
                      <Input type="number" placeholder="Completed tasks" value={eveningForm.completedTasks} onChange={e => setEveningForm({...eveningForm, completedTasks: e.target.value})} />
                      <Input type="number" placeholder="Missed tasks" value={eveningForm.missedTasks} onChange={e => setEveningForm({...eveningForm, missedTasks: e.target.value})} />
                      <div><label className="text-xs text-muted-foreground">Productivity</label><Select value={eveningForm.productivity} onChange={e => setEveningForm({...eveningForm, productivity: e.target.value})}>{Array.from({length:10},(_,i)=><option key={i+1} value={i+1}>{i+1}</option>)}</Select></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Input type="number" placeholder="Focus time (min)" value={eveningForm.focusTime} onChange={e => setEveningForm({...eveningForm, focusTime: e.target.value})} />
                      <Input type="number" placeholder="Wasted time (min)" value={eveningForm.wastedTime} onChange={e => setEveningForm({...eveningForm, wastedTime: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                      <div><label className="text-xs text-muted-foreground">Mood</label><Select value={eveningForm.eveningMood} onChange={e => setEveningForm({...eveningForm, eveningMood: e.target.value})}>{Array.from({length:10},(_,i)=><option key={i+1} value={i+1}>{i+1}</option>)}</Select></div>
                      <div><label className="text-xs text-muted-foreground">Energy</label><Select value={eveningForm.eveningEnergy} onChange={e => setEveningForm({...eveningForm, eveningEnergy: e.target.value})}>{Array.from({length:10},(_,i)=><option key={i+1} value={i+1}>{i+1}</option>)}</Select></div>
                      <div><label className="text-xs text-muted-foreground">Stress</label><Select value={eveningForm.stress} onChange={e => setEveningForm({...eveningForm, stress: e.target.value})}>{Array.from({length:10},(_,i)=><option key={i+1} value={i+1}>{i+1}</option>)}</Select></div>
                      <div><label className="text-xs text-muted-foreground">Discipline</label><Select value={eveningForm.discipline} onChange={e => setEveningForm({...eveningForm, discipline: e.target.value})}>{Array.from({length:10},(_,i)=><option key={i+1} value={i+1}>{i+1}</option>)}</Select></div>
                    </div>
                    <Textarea placeholder="What went well?" value={eveningForm.wentWell} onChange={e => setEveningForm({...eveningForm, wentWell: e.target.value})} rows={2} />
                    <Textarea placeholder="What went badly?" value={eveningForm.wentBadly} onChange={e => setEveningForm({...eveningForm, wentBadly: e.target.value})} rows={2} />
                    <Textarea placeholder="What did you learn?" value={eveningForm.learned} onChange={e => setEveningForm({...eveningForm, learned: e.target.value})} rows={2} />
                    <Textarea placeholder="What to improve tomorrow?" value={eveningForm.improveTomorrow} onChange={e => setEveningForm({...eveningForm, improveTomorrow: e.target.value})} rows={2} />
                    <Textarea placeholder="Optional journal reflection" value={eveningForm.journal} onChange={e => setEveningForm({...eveningForm, journal: e.target.value})} rows={3} />
                  </>
                )}
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsCheckInOpen(false)}>Cancel</Button>
                  <Button type="submit">Save Check-in</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setForm({ type: "DAILY", title: "", content: "", tags: "", mood: "", energy: "" })}>
                <Plus className="w-4 h-4 mr-2" /> New Entry
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New Journal Entry</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <Select value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                  {JOURNAL_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </Select>
                <Input placeholder="Title (optional)" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
                <Textarea placeholder="Write your thoughts..." value={form.content} onChange={e => setForm({...form, content: e.target.value})} rows={6} required />
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-xs text-muted-foreground">Mood (1-10)</label><Select value={form.mood} onChange={e => setForm({...form, mood: e.target.value})}><option value="">Optional</option>{Array.from({length:10},(_,i)=><option key={i+1} value={i+1}>{i+1}</option>)}</Select></div>
                  <div><label className="text-xs text-muted-foreground">Energy (1-10)</label><Select value={form.energy} onChange={e => setForm({...form, energy: e.target.value})}><option value="">Optional</option>{Array.from({length:10},(_,i)=><option key={i+1} value={i+1}>{i+1}</option>)}</Select></div>
                </div>
                <Input placeholder="Tags (comma separated)" value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} />
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  <Button type="submit">Save Entry</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search entries..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant={filter === "ALL" ? "default" : "outline"} size="sm" onClick={() => setFilter("ALL")}>All</Button>
          {JOURNAL_TYPES.map(t => (
            <Button key={t.value} variant={filter === t.value ? "default" : "outline"} size="sm" onClick={() => setFilter(t.value)}>
              {t.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Entries */}
      <div className="space-y-4">
        {entries.length === 0 ? (
          <Card><CardContent className="p-8 text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No journal entries yet. Start writing!</p>
          </CardContent></Card>
        ) : (
          entries.map(entry => {
            const typeInfo = getTypeIcon(entry.type);
            const Icon = typeInfo.icon;
            return (
              <Card key={entry.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Icon className={cn("w-5 h-5 mt-0.5", typeInfo.color)} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">{typeInfo.label}</Badge>
                        <span className="text-xs text-muted-foreground">{new Date(entry.date).toLocaleDateString()}</span>
                        {entry.mood && <span className="text-xs">Mood: {entry.mood}/10</span>}
                        {entry.energy && <span className="text-xs">Energy: {entry.energy}/10</span>}
                      </div>
                      {entry.title && <h3 className="font-medium mt-1">{entry.title}</h3>}
                      <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{entry.content}</p>
                      {entry.tags?.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {entry.tags.map(tag => <span key={tag} className="text-xs bg-accent px-2 py-0.5 rounded">{tag}</span>)}
                        </div>
                      )}
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(entry.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, BookOpen, Clock, Star, TrendingUp, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Book {
  id: string;
  title: string;
  author: string | null;
  category: string;
  status: string;
  totalPages: number | null;
  currentPage: number;
  progress: number;
  rating: number | null;
  totalReadingTime: number;
  readingSessions: any[];
}

const STATUSES = [
  { value: "WANT_TO_READ", label: "Want to Read", color: "bg-gray-500" },
  { value: "READING", label: "Reading", color: "bg-blue-500" },
  { value: "COMPLETED", label: "Completed", color: "bg-green-500" },
  { value: "ABANDONED", label: "Abandoned", color: "bg-red-500" },
];

export default function ReadingPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBookDialogOpen, setIsBookDialogOpen] = useState(false);
  const [isSessionDialogOpen, setIsSessionDialogOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<string>("");
  const [filter, setFilter] = useState("ALL");

  const [bookForm, setBookForm] = useState({ title: "", author: "", category: "non-fiction", totalPages: "", status: "WANT_TO_READ" });
  const [sessionForm, setSessionForm] = useState({ startPage: "", endPage: "", notes: "" });

  const fetchBooks = useCallback(async () => {
    const params = new URLSearchParams();
    if (filter !== "ALL") params.append("status", filter);
    const res = await fetch(`/api/books?${params}`);
    setBooks(await res.json());
    setLoading(false);
  }, [filter]);

  useEffect(() => { fetchBooks(); }, [fetchBooks]);

  const handleBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/books", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...bookForm,
        totalPages: bookForm.totalPages ? Number(bookForm.totalPages) : null,
      }),
    });
    setIsBookDialogOpen(false);
    setBookForm({ title: "", author: "", category: "non-fiction", totalPages: "", status: "WANT_TO_READ" });
    fetchBooks();
  };

  const handleSessionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBook) return;
    await fetch("/api/reading-sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookId: selectedBook,
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        startPage: sessionForm.startPage ? Number(sessionForm.startPage) : null,
        endPage: sessionForm.endPage ? Number(sessionForm.endPage) : null,
        pagesRead: sessionForm.startPage && sessionForm.endPage ? Number(sessionForm.endPage) - Number(sessionForm.startPage) : 0,
        notes: sessionForm.notes || null,
      }),
    });
    setIsSessionDialogOpen(false);
    setSessionForm({ startPage: "", endPage: "", notes: "" });
    setSelectedBook("");
    fetchBooks();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this book?")) return;
    await fetch(`/api/books?id=${id}`, { method: "DELETE" });
    fetchBooks();
  };

  const handleStatusChange = async (id: string, status: string) => {
    await fetch("/api/books", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    fetchBooks();
  };

  const totalBooks = books.length;
  const completedBooks = books.filter(b => b.status === "COMPLETED").length;
  const totalPagesRead = books.reduce((s, b) => s + b.currentPage, 0);
  const totalReadingHours = Math.round(books.reduce((s, b) => s + b.totalReadingTime, 0) / 3600 * 10) / 10;

  if (loading) return <div className="flex items-center justify-center h-full">Loading books...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reading</h1>
          <p className="text-muted-foreground">Track your reading journey</p>
        </div>
        <Dialog open={isBookDialogOpen} onOpenChange={setIsBookDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setBookForm({ title: "", author: "", category: "non-fiction", totalPages: "", status: "WANT_TO_READ" })}>
              <Plus className="w-4 h-4 mr-2" /> Add Book
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Book</DialogTitle></DialogHeader>
            <form onSubmit={handleBookSubmit} className="space-y-4 mt-4">
              <Input placeholder="Title" value={bookForm.title} onChange={e => setBookForm({...bookForm, title: e.target.value})} required />
              <Input placeholder="Author" value={bookForm.author} onChange={e => setBookForm({...bookForm, author: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                <Select value={bookForm.category} onChange={e => setBookForm({...bookForm, category: e.target.value})}>
                  <option value="fiction">Fiction</option>
                  <option value="non-fiction">Non-Fiction</option>
                  <option value="technical">Technical</option>
                  <option value="academic">Academic</option>
                </Select>
                <Select value={bookForm.status} onChange={e => setBookForm({...bookForm, status: e.target.value})}>
                  {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </Select>
              </div>
              <Input type="number" placeholder="Total pages" value={bookForm.totalPages} onChange={e => setBookForm({...bookForm, totalPages: e.target.value})} />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsBookDialogOpen(false)}>Cancel</Button>
                <Button type="submit">Add Book</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <BookOpen className="w-5 h-5 text-blue-500" />
          <div><p className="text-2xl font-bold">{totalBooks}</p><p className="text-xs text-muted-foreground">Total Books</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-500" />
          <div><p className="text-2xl font-bold">{completedBooks}</p><p className="text-xs text-muted-foreground">Completed</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <TrendingUp className="w-5 h-5 text-purple-500" />
          <div><p className="text-2xl font-bold">{totalPagesRead}</p><p className="text-xs text-muted-foreground">Pages Read</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <Clock className="w-5 h-5 text-orange-500" />
          <div><p className="text-2xl font-bold">{totalReadingHours}h</p><p className="text-xs text-muted-foreground">Reading Time</p></div>
        </CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <Button variant={filter === "ALL" ? "default" : "outline"} size="sm" onClick={() => setFilter("ALL")}>All</Button>
        {STATUSES.map(s => (
          <Button key={s.value} variant={filter === s.value ? "default" : "outline"} size="sm" onClick={() => setFilter(s.value)}>
            {s.label}
          </Button>
        ))}
      </div>

      {/* Books Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {books.map(book => (
          <Card key={book.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{book.title}</h3>
                  {book.author && <p className="text-sm text-muted-foreground">{book.author}</p>}
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive shrink-0" onClick={() => handleDelete(book.id)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>

              <Badge variant="outline" className="text-xs mb-2">{book.category}</Badge>

              {book.totalPages && (
                <div className="mt-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span>{book.currentPage}/{book.totalPages} pages</span>
                    <span>{Math.round(book.progress)}%</span>
                  </div>
                  <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-primary transition-all" style={{ width: `${book.progress}%` }} />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between mt-3">
                <div className="flex gap-1">
                  {STATUSES.map(s => (
                    <button
                      key={s.value}
                      onClick={() => handleStatusChange(book.id, s.value)}
                      className={cn(
                        "w-3 h-3 rounded-full transition-all",
                        book.status === s.value ? s.color : "bg-gray-200 dark:bg-gray-700"
                      )}
                      title={s.label}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  {book.rating && <span className="text-xs text-yellow-500">{"★".repeat(book.rating)}</span>}
                  <span className="text-xs text-muted-foreground">{Math.round(book.totalReadingTime / 60)} min</span>
                </div>
              </div>

              {/* Quick log session */}
              <Dialog open={isSessionDialogOpen && selectedBook === book.id} onOpenChange={(v) => { setIsSessionDialogOpen(v); if (!v) setSelectedBook(""); }}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full mt-3" onClick={() => setSelectedBook(book.id)}>
                    <Plus className="w-3 h-3 mr-1" /> Log Session
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Log Reading Session</DialogTitle></DialogHeader>
                  <form onSubmit={handleSessionSubmit} className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Input type="number" placeholder="Start page" value={sessionForm.startPage} onChange={e => setSessionForm({...sessionForm, startPage: e.target.value})} />
                      <Input type="number" placeholder="End page" value={sessionForm.endPage} onChange={e => setSessionForm({...sessionForm, endPage: e.target.value})} />
                    </div>
                    <Input placeholder="Notes" value={sessionForm.notes} onChange={e => setSessionForm({...sessionForm, notes: e.target.value})} />
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => { setIsSessionDialogOpen(false); setSelectedBook(""); }}>Cancel</Button>
                      <Button type="submit">Log</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        ))}
      </div>

      {books.length === 0 && (
        <Card><CardContent className="p-8 text-center">
          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No books yet. Start your reading list!</p>
        </CardContent></Card>
      )}
    </div>
  );
}

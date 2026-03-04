import { useEffect, useState } from 'react';
import { GitCommit, Loader2, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { cn } from '../lib/utils';

const CHANGELOG_URL = '/changelog.json';

function formatChangelogDate(gitDateStr) {
  const s = (gitDateStr || '').toString().trim();
  if (!s) return '';
  const iso = s.replace(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2})\s*([+-])(\d{2})(\d{2})$/, '$1T$2$3$4:$5');
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ChangelogModal() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    fetch(CHANGELOG_URL)
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
      })
      .then((data) => {
        setEntries(Array.isArray(data?.entries) ? data.entries : []);
      })
      .catch((err) => {
        setError(err?.message || '변경 이력을 불러올 수 없습니다.');
        setEntries([]);
      })
      .finally(() => setLoading(false));
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div className="fixed top-2 right-2 z-40">
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-md opacity-40 hover:opacity-70 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                aria-label="변경 이력"
              >
                <GitCommit className="h-3.5 w-3.5" />
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent side="left">변경 이력</TooltipContent>
        </Tooltip>
      </div>
      <DialogContent className="max-w-sm max-h-[80vh] flex flex-col p-0 gap-0 rounded-2xl shadow-xl border-border/60">
        <DialogHeader className="px-4 pt-3 pb-2 border-b border-border/30 space-y-0">
          <div className="flex items-center justify-between gap-2">
            <DialogTitle className="text-xs font-semibold text-muted-foreground tracking-wide">
              📋 변경 이력
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-full shrink-0 opacity-60 hover:opacity-100"
              onClick={() => setOpen(false)}
              aria-label="닫기"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-3 py-2 min-h-0">
          {loading && (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          )}
          {error && (
            <p className="py-6 text-center text-[11px] text-muted-foreground">{error}</p>
          )}
          {!loading && !error && entries.length === 0 && (
            <p className="py-6 text-center text-[11px] text-muted-foreground">
              변경 이력이 없어요.
            </p>
          )}
          {!loading && !error && entries.length > 0 && (
            <ul className="space-y-1.5 pt-0.5">
              {entries.map((entry, idx) => (
                <li
                  key={entry.hash + String(idx)}
                  className={cn(
                    'flex flex-col gap-0.5 py-1.5 px-2.5 rounded-xl border border-transparent',
                    'hover:bg-primary/5 hover:border-primary/10 transition-colors'
                  )}
                >
                  <span className="text-[11px] font-medium text-foreground break-words leading-snug">
                    {entry.subject}
                  </span>
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <code className="bg-muted/60 px-1 py-px rounded font-mono text-[10px]">
                      {entry.hash}
                    </code>
                    <span>{formatChangelogDate(entry.date)}</span>
                    {entry.author && <span>· {entry.author}</span>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

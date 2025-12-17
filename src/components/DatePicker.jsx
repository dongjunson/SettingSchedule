import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../lib/utils';
import { Button } from './ui/button';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';

export function DatePicker({ date, onSelect, placeholder = '날짜 선택', className }) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(date ? new Date(date) : new Date());

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div data-popover-trigger>
          <Button
            variant="outline"
            className={cn(
              'w-full justify-start text-left font-normal h-8 text-xs',
              !date && 'text-muted-foreground',
              className
            )}
          >
            <CalendarIcon className="mr-2 h-3 w-3" />
            {date ? format(new Date(date), 'yyyy-MM-dd') : <span>{placeholder}</span>}
          </Button>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          selected={date ? new Date(date) : undefined}
          onSelect={(selectedDate) => {
            if (selectedDate) {
              onSelect(format(selectedDate, 'yyyy-MM-dd'));
              setOpen(false);
            }
          }}
          month={month}
          onMonthChange={setMonth}
        />
      </PopoverContent>
    </Popover>
  );
}

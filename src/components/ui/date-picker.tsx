
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { forwardRef } from "react";

export interface DatePickerProps {
  id?: string;
  value?: Date | undefined;
  onSelect?: (date: Date | undefined) => void;
  mode?: "single";
  dateFormat?: string;
}

export const DatePicker = forwardRef<HTMLButtonElement, DatePickerProps>(
  ({ id, value, onSelect, mode = "single", dateFormat = "PPP" }, ref) => {
    const handleSelect = (date: Date | undefined) => {
      if (onSelect) {
        // Ensure the selected date includes time component
        if (date) {
          // Set to noon to avoid timezone issues
          const normalizedDate = new Date(date);
          normalizedDate.setHours(12, 0, 0, 0);
          onSelect(normalizedDate);
        } else {
          onSelect(undefined);
        }
      }
    };

    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id={id}
            ref={ref}
            variant="outline"
            className={cn(
              "w-[calc(100%-85px)] justify-start text-left font-normal",
              !value && "text-muted-foreground"
            )}
            type="button" // Ensure it doesn't submit forms
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? format(value, dateFormat) : <span>Seleccionar fecha</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode={mode}
            selected={value}
            onSelect={handleSelect}
            initialFocus
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>
    );
  }
);

DatePicker.displayName = "DatePicker";

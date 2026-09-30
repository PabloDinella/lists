import * as React from "react"
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker, type ClassNames } from "react-day-picker"

import { cn } from "@/lib/utils"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  components,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  const defaultClassNames: Partial<ClassNames> = {
    root: "p-3",
    months: "relative flex flex-col gap-4 sm:flex-row",
    month: "space-y-4",
    month_caption: "relative flex h-7 items-center justify-center pt-1",
    caption_label: "text-sm font-medium",
    nav: "absolute inset-x-0 top-0 z-10 flex w-full items-center justify-between",
    button_previous:
      "inline-flex size-7 items-center justify-center rounded-md border border-input bg-transparent p-0 opacity-70 hover:bg-accent hover:text-accent-foreground hover:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-30",
    button_next:
      "inline-flex size-7 items-center justify-center rounded-md border border-input bg-transparent p-0 opacity-70 hover:bg-accent hover:text-accent-foreground hover:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-30",
    month_grid: "w-full border-collapse",
    weekdays: "flex",
    weekday: "w-9 rounded-md text-[0.8rem] font-normal text-muted-foreground",
    week: "mt-2 flex w-full",
    day: "relative size-9 p-0 text-center text-sm",
    day_button:
      "inline-flex size-9 items-center justify-center rounded-md p-0 font-normal hover:bg-accent hover:text-accent-foreground focus-visible:relative focus-visible:z-10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring aria-selected:opacity-100",
    today: "bg-accent text-accent-foreground",
    selected:
      "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
    outside: "text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
    disabled: "text-muted-foreground opacity-50",
    hidden: "invisible",
  }

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{ ...defaultClassNames, ...classNames }}
      components={{
        Chevron: ({ orientation, className: chevronClassName, ...chevronProps }) => {
          const Icon =
            orientation === "left"
              ? ChevronLeft
              : orientation === "right"
                ? ChevronRight
                : ChevronDown
          return <Icon className={cn("size-4", chevronClassName)} {...chevronProps} />
        },
        ...components,
      }}
      {...props}
    />
  )
}

Calendar.displayName = "Calendar"

export { Calendar }

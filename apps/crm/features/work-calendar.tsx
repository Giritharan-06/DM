"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Plus,
  Clock,
} from "lucide-react";
import { Button, Card, Badge, Empty } from "@zyroz/ui";
import { calendarDays, localDate } from "@/lib/calendar";
import type { RecordRow } from "@/lib/types";
export function WorkCalendar({
  module,
  rows,
  month,
  onMonthChange,
  onCreate,
  readOnly = false,
  basePath = "",
}: {
  module: string;
  rows: RecordRow[];
  month: Date;
  onMonthChange: (date: Date) => void;
  onCreate: (date: Date) => void;
  readOnly?: boolean;
  basePath?: string;
}) {
  const [selected, setSelected] = useState(() => new Date());
  const buttons = useRef(new Map<string, HTMLButtonElement>());
  const days = calendarDays(month),
    today = localDate(new Date());
  const field = module === "tasks" ? "deadline" : "dueAt";
  const matching = (day: Date) =>
    rows.filter((row) => {
      const date = new Date(String(row[field]));
      return (
        !Number.isNaN(date.getTime()) && localDate(date) === localDate(day)
      );
    });
  const events = matching(selected);
  function select(day: Date, focus = false) {
    setSelected(day);
    if (focus) buttons.current.get(localDate(day))?.focus();
  }
  return (
    <div className="work-calendar">
      <Card className="calendar-panel">
        <div className="calendar-heading">
          <div>
            <h2>
              {month.toLocaleDateString("en-IN", {
                month: "long",
                year: "numeric",
              })}
            </h2>
            <p>Deadlines and conversations, together in view.</p>
          </div>
          <div className="row">
            <Button
              variant="secondary"
              onClick={() => {
                onMonthChange(new Date());
                setSelected(new Date());
              }}
            >
              Today
            </Button>
            <Button
              variant="ghost"
              aria-label="Previous month"
              onClick={() => {
                const date = new Date(
                  month.getFullYear(),
                  month.getMonth() - 1,
                  1,
                );
                onMonthChange(date);
                setSelected(date);
              }}
            >
              <ChevronLeft size={18} />
            </Button>
            <Button
              variant="ghost"
              aria-label="Next month"
              onClick={() => {
                const date = new Date(
                  month.getFullYear(),
                  month.getMonth() + 1,
                  1,
                );
                onMonthChange(date);
                setSelected(date);
              }}
            >
              <ChevronRight size={18} />
            </Button>
          </div>
        </div>
        <div className="calendar-scroll">
          <table
            className="month-grid"
            aria-label={`${module} monthly calendar`}
          >
            <thead>
              <tr>
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                  (day) => (
                    <th key={day} scope="col">
                      {day}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 6 }, (_, week) => (
                <tr key={week}>
                  {days.slice(week * 7, week * 7 + 7).map((day) => {
                    const key = localDate(day),
                      items = matching(day),
                      active = key === localDate(selected);
                    return (
                      <td
                        key={key}
                        className={`${day.getMonth() !== month.getMonth() ? "outside-month" : ""} ${active ? "selected-day" : ""}`}
                      >
                        <button
                          ref={(node) => {
                            if (node) buttons.current.set(key, node);
                            else buttons.current.delete(key);
                          }}
                          aria-label={`${day.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}, ${items.length} scheduled`}
                          aria-pressed={active}
                          tabIndex={active ? 0 : -1}
                          onClick={() => select(day)}
                          onKeyDown={(event) => {
                            const shift = (
                              {
                                ArrowLeft: -1,
                                ArrowRight: 1,
                                ArrowUp: -7,
                                ArrowDown: 7,
                              } as Record<string, number>
                            )[event.key];
                            if (shift) {
                              event.preventDefault();
                              const next = new Date(day);
                              next.setDate(day.getDate() + shift);
                              if (buttons.current.has(localDate(next)))
                                select(next, true);
                            }
                          }}
                        >
                          <span
                            className={`day-number ${key === today ? "today" : ""}`}
                          >
                            {day.getDate()}
                          </span>
                          {items.slice(0, 2).map((item) => (
                            <span
                              className={`calendar-event ${item.completedAt || item.status === "completed" ? "done" : ""}`}
                              key={item.id}
                            >
                              {String(item.title || item.leadName || item.type)}
                            </span>
                          ))}
                          {items.length > 2 && (
                            <span className="event-more">
                              +{items.length - 2} more
                            </span>
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Card className="calendar-agenda">
        <div className="panel-title">
          <div>
            <span className="eyebrow">DAY AGENDA</span>
            <h2>
              {selected.toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
              })}
            </h2>
          </div>
          <CalendarDays size={21} />
        </div>
        <Button
          variant="secondary"
          disabled={readOnly}
          onClick={() => onCreate(selected)}
        >
          <Plus size={14} />
          Schedule {module === "tasks" ? "task" : "follow-up"}
        </Button>
        {events.length ? (
          events.map((row) => (
            <article className="agenda-event" key={row.id}>
              <span className="agenda-time">
                <Clock size={12} />
                {new Date(String(row[field])).toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              <Link
                href={`${basePath}/${module === "tasks" ? "tasks" : "leads"}/${module === "tasks" ? row.id : row.leadId}`}
              >
                <h3>{String(row.title || row.leadName || row.type)}</h3>
              </Link>
              <p>
                {String(row.description || row.notes || "Scheduled activity")}
              </p>
              <div className="row">
                <Badge className={String(row.status || "new")}>
                  {String(
                    row.status || (row.completedAt ? "completed" : row.type),
                  ).replaceAll("_", " ")}
                </Badge>
                <span className="muted">
                  {row.assignedName || "Assigned employee"}
                </span>
              </div>
            </article>
          ))
        ) : (
          <Empty
            title="Room for your next step"
            description="No scheduled records on this day in the current results."
          />
        )}
      </Card>
    </div>
  );
}

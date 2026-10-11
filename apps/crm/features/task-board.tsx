"use client";
import Link from "next/link";
import { Clock, UserRound, GripVertical, CheckSquare } from "lucide-react";
import { Card, Badge } from "@zyroz/ui";
import type { RecordRow } from "@/lib/types";
export const taskStatuses = [
  "to_do",
  "in_progress",
  "review",
  "completed",
  "blocked",
] as const;
export function TaskBoard({
  rows,
  onChange,
  busy = false,
  readOnly = false,
  basePath = "",
}: {
  rows: RecordRow[];
  onChange: (id: string, status: string) => void;
  busy?: boolean;
  readOnly?: boolean;
  basePath?: string;
}) {
  return (
    <div className="pipeline-board task-board">
      {taskStatuses.map((status) => {
        const records = rows.filter((row) => row.status === status);
        return (
          <section
            className={`pipeline-column task-column ${status}`}
            aria-label={`${status.replaceAll("_", " ")} tasks`}
            key={status}
            onDragOver={(event) => {
              if (!readOnly && !busy) event.preventDefault();
            }}
            onDrop={(event) => {
              event.preventDefault();
              const id = event.dataTransfer.getData("text/plain");
              if (!readOnly && !busy && rows.some((row) => row.id === id))
                onChange(id, status);
            }}
          >
            <div className="pipeline-column-title">
              <span>
                <i />
                {status.replaceAll("_", " ")}
              </span>
              <span>{records.length}</span>
            </div>
            {records.map((row) => (
              <Card
                className="deal-card task-card"
                key={row.id}
                draggable={!busy && !readOnly}
                onDragStart={(event) =>
                  event.dataTransfer.setData("text/plain", String(row.id))
                }
              >
                <div className="row between">
                  <Badge className={String(row.priority)}>{row.priority}</Badge>
                  <GripVertical size={14} className="muted" />
                </div>
                <Link href={`${basePath}/tasks/${row.id}`}>
                  <h3>{row.title}</h3>
                </Link>
                {row.clientName && <p>{row.clientName}</p>}
                <div className="task-meta">
                  <span>
                    <Clock size={12} />
                    {new Date(String(row.deadline)).toLocaleDateString(
                      "en-IN",
                      { day: "numeric", month: "short" },
                    )}
                  </span>
                  <span>
                    <UserRound size={12} />
                    {row.assignedName || "Assigned employee"}
                  </span>
                </div>
                <label>
                  <span className="sr-only">Status for {row.title}</span>
                  <select
                    disabled={busy || readOnly}
                    value={String(row.status)}
                    onChange={(event) =>
                      onChange(String(row.id), event.target.value)
                    }
                  >
                    {taskStatuses.map((value) => (
                      <option key={value} value={value}>
                        {value.replaceAll("_", " ")}
                      </option>
                    ))}
                  </select>
                </label>
              </Card>
            ))}
            {!records.length && (
              <div className="board-empty">
                <CheckSquare size={23} />
                <p>No tasks in this stage</p>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

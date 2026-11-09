"use client";
import type { LayoutItem } from "@/lib/types";
import { moveItem, useAdmin } from "./context";
import { Switch, iconBtn, inputCls, useDragSort } from "./ui";

export const SECTION_NAMES: Record<string, { name: string; admin: string }> = {
  stats: { name: "Key numbers", admin: "stats" },
  about: { name: "About", admin: "about" },
  work: { name: "Projects", admin: "projects" },
  experience: { name: "Experience", admin: "experience" },
  recognition: { name: "Awards and certificates", admin: "recognition" },
  skills: { name: "Skills", admin: "skills" },
  leadership: { name: "Leadership and education", admin: "leadership" },
  contact: { name: "Contact", admin: "contact" },
};

// Order, visibility and menu labels of the home page sections.
export default function LayoutEditor({ value, goTo }: { value: LayoutItem[]; goTo: (section: string) => void }) {
  const { edit, set } = useAdmin();
  const move = (from: number, to: number) => edit(["layout"], (old) => moveItem(old as LayoutItem[], from, to), { step: true });
  const drag = useDragSort(move);
  return (
    <div>
      <p className="mb-4 text-sm text-muted">
        The top of the page (your name and photo) always comes first. Below it, sections appear in this order. A section with a menu label also gets a link in
        the top menu.
      </p>
      <div className="space-y-2">
        {value.map((l, i) => {
          const meta = SECTION_NAMES[l.id] ?? { name: l.id, admin: "" };
          return (
            <div key={l.id} {...drag.target(i)} className={`rounded-xl border bg-surface/60 p-3 transition ${drag.over === i ? "border-accent ring-2 ring-accent" : "border-line"} ${l.show ? "" : "opacity-60"}`}>
              <div className="flex items-center gap-2">
                <span {...drag.handle(i)} title="Drag to reorder" className="hidden cursor-grab select-none px-1 text-muted/50 hover:text-muted sm:block">
                  ⋮⋮
                </span>
                <Switch value={l.show} onChange={(v) => set(["layout", i, "show"], v, { step: true })} label={`Show ${meta.name}`} />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{meta.name}</span>
                {meta.admin && (
                  <button type="button" onClick={() => goTo(meta.admin)} className="shrink-0 text-xs text-accent hover:underline">
                    Edit →
                  </button>
                )}
                <button type="button" className={iconBtn} disabled={i === 0} onClick={() => move(i, i - 1)} aria-label="Move up">
                  ↑
                </button>
                <button type="button" className={iconBtn} disabled={i === value.length - 1} onClick={() => move(i, i + 1)} aria-label="Move down">
                  ↓
                </button>
              </div>
              <div className="mt-2 flex items-center gap-2 sm:pl-[4.25rem]">
                <label className="shrink-0 text-xs text-muted" htmlFor={`nav-${l.id}`}>
                  Menu label
                </label>
                <input
                  id={`nav-${l.id}`}
                  className={inputCls}
                  value={l.nav}
                  placeholder="Not in the menu"
                  onChange={(e) => set(["layout", i, "nav"], e.target.value)}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

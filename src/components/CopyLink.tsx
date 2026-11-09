"use client";
import { useState } from "react";
import { copyText } from "@/lib/clipboard";
import { LinkIcon } from "./ui";

// Copies the full address of a page on this site, on whatever domain the visitor is using.
export default function CopyLink({ path, label, done, className = "" }: { path: string; label: string; done: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        if (await copyText(window.location.origin + path)) {
          setCopied(true);
          setTimeout(() => setCopied(false), 2200);
        }
      }}
      className={`inline-flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-sm text-muted transition hover:border-line-strong hover:text-text ${copied ? "!border-accent/60 !text-accent" : ""} ${className}`}
    >
      <LinkIcon className="h-3.5 w-3.5" />
      <span aria-live="polite">{copied ? done : label}</span>
    </button>
  );
}

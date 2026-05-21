"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Card } from "@/components/ui/card";
import type { ArticleStatus } from "@/lib/types";

/**
 * Draft panel — renders the article markdown via react-markdown.
 *
 * Three states:
 *   - empty (no draft, status-aware empty-state CTA)
 *   - streaming (markdown grows live, blinking cursor at the end)
 *   - final (full draft loaded from articles.markdown)
 *
 * The parent owns the streaming buffer; this component just renders.
 */
export function DraftPanel({
  markdown,
  status,
  streaming = false,
}: {
  markdown: string | null;
  status: ArticleStatus;
  streaming?: boolean;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold">Draft</h2>
        {streaming && (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            Writing live
          </span>
        )}
      </div>
      {markdown ? (
        <div className="prose prose-sm max-w-none prose-headings:tracking-tight prose-p:leading-relaxed">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
          {streaming && (
            <span
              aria-hidden
              className="inline-block w-2 h-4 -mb-0.5 ml-0.5 bg-foreground/70 animate-pulse align-baseline"
            />
          )}
        </div>
      ) : streaming ? (
        <p className="text-sm text-muted-foreground italic">
          Connecting to Gemini…
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          {status === "ready_to_draft"
            ? "Click Write draft to generate the article."
            : "Draft appears here after the brief is complete and slots are filled."}
        </p>
      )}
    </Card>
  );
}

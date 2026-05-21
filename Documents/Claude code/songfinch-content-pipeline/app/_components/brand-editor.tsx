"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, Plus, Wand2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { saveBrand } from "../actions";
import type { Brand, CustomerImpact, Persona } from "@/lib/types";

export function BrandEditor({ initial }: { initial: Brand }) {
  const [name, setName] = useState(initial.name);
  const [about, setAbout] = useState(initial.about);
  const [personas, setPersonas] = useState<Persona[]>(
    initial.personas.length > 0
      ? initial.personas
      : [{ name: "", description: "" }],
  );
  const [impacts, setImpacts] = useState<CustomerImpact[]>(
    initial.customer_impact.length > 0
      ? initial.customer_impact
      : [{ situation: "", how_brand_helps: "" }],
  );
  const [pending, startTransition] = useTransition();
  const [urlText, setUrlText] = useState("");
  const [mapping, setMapping] = useState(false);

  const handleAutoFill = async () => {
    const urls = urlText
      .split(/\s+/)
      .map((u) => u.trim())
      .filter((u) => /^https?:\/\//.test(u));
    if (urls.length === 0) {
      toast.error("Paste at least one URL starting with http(s)://");
      return;
    }
    setMapping(true);
    try {
      const res = await fetch("/api/agents/brand/map-url", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ urls }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "Mapping failed");
        return;
      }
      const b = data.brand;
      setName(b.name);
      setAbout(b.about);
      setPersonas(b.personas);
      setImpacts(b.customer_impact);
      toast.success(
        `Mapped ${b.personas.length} personas + ${b.customer_impact.length} impacts. Review and save.`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "unknown error");
    } finally {
      setMapping(false);
    }
  };

  const handleSave = () => {
    const cleanedPersonas = personas.filter(
      (p) => p.name.trim() || p.description.trim(),
    );
    const cleanedImpacts = impacts.filter(
      (c) => c.situation.trim() || c.how_brand_helps.trim(),
    );
    startTransition(async () => {
      const res = await saveBrand({
        name: name.trim(),
        about: about.trim(),
        personas: cleanedPersonas,
        customer_impact: cleanedImpacts,
      });
      if (res.ok) toast.success("Brand saved");
      else toast.error(res.error);
    });
  };

  const isReady =
    name.trim().length > 0 &&
    about.trim().length > 50 &&
    personas.some((p) => p.name && p.description) &&
    impacts.some((c) => c.situation && c.how_brand_helps);

  return (
    <div className="space-y-6">
      {/* Auto-fill from URLs */}
      <Card className="p-6 space-y-3 border-dashed bg-zinc-50">
        <div className="flex items-center gap-2">
          <Wand2 className="w-4 h-4 text-muted-foreground" />
          <h2 className="font-semibold">Auto-fill from URLs</h2>
          <span className="text-xs text-muted-foreground">
            · skip the typing
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Paste 3-7 brand URLs (homepage, about, sample artist pages, reviews).
          Gemini reads them and proposes a brand graph. You review and tweak
          before saving.
        </p>
        <Textarea
          rows={3}
          value={urlText}
          onChange={(e) => setUrlText(e.target.value)}
          placeholder="https://songfinch.com&#10;https://songfinch.com/about&#10;https://songfinch.com/artists"
          className="font-mono text-xs bg-white"
          disabled={mapping}
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Replaces current form values. Save after reviewing.
          </span>
          <Button
            onClick={handleAutoFill}
            disabled={mapping || urlText.trim().length === 0}
            variant="outline"
            className="gap-2 bg-white"
          >
            {mapping ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Reading URLs…
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                Auto-fill
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Basics */}
      <Card className="p-6 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="brand-name" className="text-sm font-medium">
            Brand name
          </Label>
          <Input
            id="brand-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Songfinch"
            className="max-w-sm text-base"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="brand-about" className="text-sm font-medium">
            About
            <span className="font-normal text-muted-foreground ml-2">
              · what is this brand, who it&apos;s for, what makes it different
            </span>
          </Label>
          <Textarea
            id="brand-about"
            rows={6}
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            placeholder="Songfinch makes custom songs written by real artists. A customer shares their story; an artist on our roster writes and records a song from that story; the customer receives it within 7 days. We're not AI music. Our wedge is human songwriters making emotionally specific work for milestone moments — weddings, memorials, anniversaries, sobriety milestones, retirements."
            className="text-sm leading-relaxed"
          />
          <p className="text-xs text-muted-foreground">
            {about.length} chars · aim for 200-600
          </p>
        </div>
      </Card>

      {/* Personas */}
      <Card className="p-6 space-y-4">
        <div className="flex items-baseline justify-between">
          <div>
            <h2 className="font-semibold">Personas</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Who buys. Be specific — "adult children buying for parents" beats
              "gift-givers".
            </p>
          </div>
          <span className="text-xs text-muted-foreground tabular-nums">
            {personas.filter((p) => p.name).length} defined
          </span>
        </div>
        <div className="space-y-3">
          {personas.map((p, i) => (
            <div
              key={i}
              className="grid grid-cols-[1fr_2fr_auto] gap-3 items-start group"
            >
              <Input
                value={p.name}
                onChange={(e) => {
                  const next = [...personas];
                  next[i] = { ...p, name: e.target.value };
                  setPersonas(next);
                }}
                placeholder="Persona name"
                className="text-sm"
              />
              <Textarea
                rows={2}
                value={p.description}
                onChange={(e) => {
                  const next = [...personas];
                  next[i] = { ...p, description: e.target.value };
                  setPersonas(next);
                }}
                placeholder="Who they are, what they're doing when they encounter the brand"
                className="text-sm min-h-[2.5rem]"
              />
              <Button
                size="icon"
                variant="ghost"
                onClick={() =>
                  setPersonas(personas.filter((_, idx) => idx !== i))
                }
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Remove persona"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            setPersonas([...personas, { name: "", description: "" }])
          }
        >
          <Plus className="w-4 h-4 mr-1" /> Add persona
        </Button>
      </Card>

      {/* Customer impact */}
      <Card className="p-6 space-y-4">
        <div className="flex items-baseline justify-between">
          <div>
            <h2 className="font-semibold">Customer impact</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Specific situations where the brand changes outcomes. The more
              specific, the better the threads.
            </p>
          </div>
          <span className="text-xs text-muted-foreground tabular-nums">
            {impacts.filter((c) => c.situation).length} defined
          </span>
        </div>
        <div className="space-y-3">
          {impacts.map((c, i) => (
            <div
              key={i}
              className="grid grid-cols-[1fr_2fr_auto] gap-3 items-start group"
            >
              <Textarea
                rows={2}
                value={c.situation}
                onChange={(e) => {
                  const next = [...impacts];
                  next[i] = { ...c, situation: e.target.value };
                  setImpacts(next);
                }}
                placeholder="The situation — e.g. 'memorial for a parent who didn't get a real funeral'"
                className="text-sm min-h-[2.5rem]"
              />
              <Textarea
                rows={2}
                value={c.how_brand_helps}
                onChange={(e) => {
                  const next = [...impacts];
                  next[i] = { ...c, how_brand_helps: e.target.value };
                  setImpacts(next);
                }}
                placeholder="How the brand changes the outcome — what they walk away with"
                className="text-sm min-h-[2.5rem]"
              />
              <Button
                size="icon"
                variant="ghost"
                onClick={() =>
                  setImpacts(impacts.filter((_, idx) => idx !== i))
                }
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Remove impact"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            setImpacts([...impacts, { situation: "", how_brand_helps: "" }])
          }
        >
          <Plus className="w-4 h-4 mr-1" /> Add impact
        </Button>
      </Card>

      {/* Save + next */}
      <div className="sticky bottom-4 z-10">
        <Card className="p-4 flex items-center justify-between gap-4 shadow-lg border-zinc-200">
          <div className="text-sm">
            {isReady ? (
              <span className="text-foreground">
                Looks ready. Save, then generate threads from this brand.
              </span>
            ) : (
              <span className="text-muted-foreground">
                Fill in brand name, about (50+ chars), 1 persona, 1 impact to
                enable threads.
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleSave}
              disabled={pending}
              className="bg-white"
            >
              {pending ? "Saving…" : "Save brand"}
            </Button>
            {isReady && (
              <Link href="/threads">
                <Button className="bg-zinc-950 hover:bg-zinc-800">
                  Threads →
                </Button>
              </Link>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

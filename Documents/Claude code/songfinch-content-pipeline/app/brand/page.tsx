import { fetchBrand } from "@/lib/data";
import { Card } from "@/components/ui/card";
import { BrandDisplay } from "../_components/brand-display";
import { BrandEditor } from "../_components/brand-editor";
import { SetupNotice } from "../_components/setup-notice";
import { ClearAllButton } from "../_components/clear-all-button";

export default async function BrandPage() {
  const { data, configured, error } = await fetchBrand();
  if (!configured) return <SetupNotice />;

  const hasStoredBrand =
    data.id && (data.name?.trim() || (data.about?.trim()?.length ?? 0) > 0);

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Brand</h1>
        <p className="text-muted-foreground text-balance max-w-xl">
          The brand is what everything cascades from. Personas and customer
          impact define who you&apos;re writing for and why it matters. The
          better this is, the better the threads and articles will be.
        </p>
      </div>

      {error && (
        <Card className="border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </Card>
      )}

      {hasStoredBrand && <BrandDisplay brand={data} />}

      <div className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          {hasStoredBrand ? "Edit brand" : "Set up brand"}
        </h2>
        <BrandEditor initial={data} />
      </div>

      {/* Danger zone — separated visually from the editor by lots of vertical
          space. Hard to fire accidentally. Wipes all threads/articles/research
          but keeps brand + reference exemplars. */}
      <div className="pt-12 mt-12 border-t">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground mb-3">
          Danger zone
        </h2>
        <ClearAllButton />
      </div>
    </div>
  );
}

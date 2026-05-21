import { Card } from "@/components/ui/card";

export function SetupNotice() {
  return (
    <Card className="p-8 max-w-2xl mx-auto">
      <h2 className="text-lg font-semibold">Supabase not configured</h2>
      <p className="text-sm text-muted-foreground mt-2">
        Copy{" "}
        <code className="bg-muted px-1 py-0.5 rounded">.env.local.example</code>{" "}
        to <code className="bg-muted px-1 py-0.5 rounded">.env.local</code> and
        fill in your Supabase URL and service role key. Then restart{" "}
        <code className="bg-muted px-1 py-0.5 rounded">npm run dev</code>.
      </p>
      <ol className="text-sm text-muted-foreground mt-4 space-y-2 list-decimal list-inside">
        <li>Create the Supabase project (or use an existing one)</li>
        <li>
          Apply the migration in{" "}
          <code className="bg-muted px-1 py-0.5 rounded">
            supabase/migrations/0001_initial_schema.sql
          </code>
        </li>
        <li>
          Paste service role key into{" "}
          <code className="bg-muted px-1 py-0.5 rounded">.env.local</code>
        </li>
        <li>Restart the dev server</li>
      </ol>
    </Card>
  );
}

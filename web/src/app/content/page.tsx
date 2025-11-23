export default function ContentPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Content</h1>
        <p className="text-sm text-muted-foreground">
          Browse and manage entries across all of your content models.
        </p>
      </div>
      <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
        Content table will go here – filter by model, status, and environment.
      </div>
    </div>
  );
}



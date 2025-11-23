export default function SettingsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure environments, API access, and workspace preferences.
        </p>
      </div>
      <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
        Settings panels will go here – environments, webhooks, API keys, and
        roles.
      </div>
    </div>
  );
}



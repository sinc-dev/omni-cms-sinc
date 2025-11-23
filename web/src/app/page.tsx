import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome back
          </h1>
          <p className="text-sm text-muted-foreground">
            Overview of your content, models, and publishing activity.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button>Create content</Button>
          <Button variant="outline">New model</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Published entries</CardDescription>
            <CardTitle className="text-2xl">128</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            +12 this week
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Drafts</CardDescription>
            <CardTitle className="text-2xl">34</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            You have content waiting for review.
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Content models</CardDescription>
            <CardTitle className="text-2xl">9</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Reuse structures across your sites.
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Environments</CardDescription>
            <CardTitle className="text-2xl">3</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Production, staging, and development.
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr,1.2fr]">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="text-sm">Recent activity</CardTitle>
            <CardDescription>
              Latest changes across your spaces.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="font-medium">Homepage hero copy</p>
                  <p className="text-xs text-muted-foreground">
                    Updated by Alex • 5 minutes ago
                  </p>
                </div>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  Published
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="font-medium">Blog: Product launch</p>
                  <p className="text-xs text-muted-foreground">
                    Updated by Taylor • 1 hour ago
                  </p>
                </div>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                  Review
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="font-medium">Navigation items</p>
                  <p className="text-xs text-muted-foreground">
                    Updated by Chris • 3 hours ago
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-900 dark:text-slate-300">
                  Draft
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Getting started</CardTitle>
            <CardDescription>
              Quick links to configure your Omni CMS.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <button className="flex w-full items-center justify-between rounded-md border bg-background px-3 py-2 text-left text-xs hover:bg-accent">
              <span>Define your first content model</span>
              <span className="text-muted-foreground">Models</span>
            </button>
            <button className="flex w-full items-center justify-between rounded-md border bg-background px-3 py-2 text-left text-xs hover:bg-accent">
              <span>Connect a preview environment</span>
              <span className="text-muted-foreground">Settings</span>
            </button>
            <button className="flex w-full items-center justify-between rounded-md border bg-background px-3 py-2 text-left text-xs hover:bg-accent">
              <span>Invite collaborators</span>
              <span className="text-muted-foreground">Team</span>
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

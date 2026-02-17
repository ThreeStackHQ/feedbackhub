// Force dynamic rendering (don't prerender at build time)
export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p className="text-muted-foreground mt-2">Manage your feedback boards</p>
    </div>
  );
}

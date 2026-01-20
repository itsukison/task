export default function DashboardLoading() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-accent" />
        <p className="text-sm text-gray-500">Loading workspace...</p>
      </div>
    </div>
  );
}

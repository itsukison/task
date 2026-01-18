export default function WorkspaceLoading() {
  return (
    <div className="flex h-full w-full flex-col">
      {/* Header skeleton */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="h-8 w-64 animate-pulse rounded bg-gray-200" />
          <div className="flex gap-2">
            <div className="h-8 w-24 animate-pulse rounded bg-gray-200" />
            <div className="h-8 w-24 animate-pulse rounded bg-gray-200" />
          </div>
        </div>
      </div>

      {/* Content skeleton */}
      <div className="flex flex-1">
        <div className="w-1/2 border-r border-gray-200 p-4">
          <div className="space-y-2">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded bg-gray-100" />
            ))}
          </div>
        </div>
        <div className="w-1/2 p-4">
          <div className="h-full animate-pulse rounded bg-gray-100" />
        </div>
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <div aria-busy="true" className="space-y-4">
      <div className="h-8 w-48 animate-pulse rounded bg-[#e3e9ee]" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-[#e3e9ee]" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-xl bg-[#e3e9ee]" />
    </div>
  );
}

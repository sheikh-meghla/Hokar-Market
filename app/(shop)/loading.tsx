export default function Loading() {
  return (
    <main className="min-h-screen bg-white" aria-busy="true">
      <div className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6">
        <div className="mb-8 h-10 w-48 animate-pulse rounded bg-[#edf0f3]" />
        <ul className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <li key={index}>
              <div className="aspect-square animate-pulse rounded-lg bg-[#edf0f3]" />
              <div className="mt-3 h-4 w-3/4 animate-pulse rounded bg-[#edf0f3]" />
              <div className="mt-2 h-4 w-1/3 animate-pulse rounded bg-[#edf0f3]" />
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}

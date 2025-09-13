export default function Forbidden() {
  return (
    <div className="h-[70vh] grid place-items-center text-center px-6">
      <div>
        <h1 className="text-5xl font-bold text-red-600">403</h1>
        <p className="mt-2 text-lg font-semibold">
          You don’t have permission to access this page.
        </p>
        <a
          href="/"
          className="mt-6 inline-block rounded bg-black px-4 py-2 text-white hover:bg-black/80"
        >
          Back to Home
        </a>
      </div>
    </div>
  );
}

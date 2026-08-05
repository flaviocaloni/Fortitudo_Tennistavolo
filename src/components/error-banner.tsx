export default function ErrorBanner({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div className="mb-6 rounded-md border-2 border-red-400 bg-red-50 px-4 py-3 text-red-800 shadow-sm">
      <p className="flex items-start gap-3">
        <span className="text-xl font-bold">❌</span>
        <span className="text-sm font-medium">{message}</span>
      </p>
    </div>
  );
}

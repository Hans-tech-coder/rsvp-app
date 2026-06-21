import { Loader2 } from 'lucide-react';

export default function AdminLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] w-full gap-4 text-gray-500 dark:text-zinc-400">
      <Loader2 className="w-8 h-8 animate-spin" />
      <p className="text-sm font-medium animate-pulse">Loading data...</p>
    </div>
  );
}

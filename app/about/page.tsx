import Link from 'next/link';

export default function About() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black p-4">
      <div className="w-full max-w-4xl rounded-2xl bg-white dark:bg-zinc-900 shadow-lg dark:shadow-zinc-800/50 p-6 flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">About</h1>
        <Link 
          href="/"
          className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 underline"
        >
          Back to Full Pokemon List
        </Link>
      </div>
    </div>
  );
}

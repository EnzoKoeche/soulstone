import type { ReactNode } from "react";

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-zinc-800 bg-zinc-900/60 ${className}`}>
      {children}
    </div>
  );
}

export function CenterMessage({ title, detail }: { title: string; detail?: ReactNode }) {
  return (
    <div className="flex min-h-44 flex-1 flex-col items-center justify-center gap-1 p-8 text-center">
      <p className="font-medium text-zinc-300">{title}</p>
      {detail ? <p className="max-w-md text-sm text-zinc-500">{detail}</p> : null}
    </div>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex min-h-44 flex-1 items-center justify-center gap-3 p-8 text-zinc-400">
      <span className="size-4 animate-spin rounded-full border-2 border-zinc-600 border-t-zinc-200" />
      {label ? <span className="text-sm">{label}</span> : null}
    </div>
  );
}

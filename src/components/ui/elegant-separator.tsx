import { cn } from "@/lib/utils";

export default function ElegantSeparator({ className }: { className?: string }) {
  return (
    <div className={cn("w-full flex justify-center items-center py-8 md:py-12 opacity-50", className)}>
      <div className="w-24 md:w-48 h-[1px] bg-gradient-to-r from-transparent to-slate-400" />
      <div className="mx-3 w-1.5 h-1.5 border border-slate-500 rotate-45 transition-transform duration-1000 hover:rotate-[135deg]" />
      <div className="w-24 md:w-48 h-[1px] bg-gradient-to-l from-transparent to-slate-400" />
    </div>
  );
}

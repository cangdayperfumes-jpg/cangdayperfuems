import { cn } from "@/lib/utils";

export default function ElegantSeparator({ className }: { className?: string }) {
  return (
    <div className={cn("w-full flex justify-center items-center py-4 md:py-6", className)}>
      <div className="w-24 md:w-48 h-px bg-gradient-to-r from-transparent to-gold/50" />
      <div className="mx-3 w-1.5 h-1.5 border border-gold rotate-45 transition-transform duration-1000 hover:rotate-[135deg]" />
      <div className="w-24 md:w-48 h-px bg-gradient-to-l from-transparent to-gold/50" />
    </div>
  );
}

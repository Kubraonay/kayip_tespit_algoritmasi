import { cn } from "@/lib/utils";

export function HamburgerIcon({ className }: { className?: string }) {
  return (
    <span
      className={cn("flex w-[18px] flex-col justify-center gap-[5px]", className)}
      aria-hidden
    >
      <span className="block h-[2px] w-full rounded-full bg-current" />
      <span className="block h-[2px] w-full rounded-full bg-current" />
      <span className="block h-[2px] w-full rounded-full bg-current" />
    </span>
  );
}

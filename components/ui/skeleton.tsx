import { cn } from "@/lib/utils"

function Skeleton({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn("animate-pulse rounded bg-gray-200/40 dark:bg-zinc-800/20", className)}
            {...props}
        />
    )
}

export { Skeleton }

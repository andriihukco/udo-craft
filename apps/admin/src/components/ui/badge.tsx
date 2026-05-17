import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1.5 overflow-hidden rounded-full border border-transparent px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-sm",
        secondary: "bg-secondary text-secondary-foreground",
        destructive: "bg-destructive/10 text-destructive border-destructive/20",
        outline: "border-border text-muted-foreground bg-background hover:border-foreground/20 hover:text-foreground",
        ghost: "hover:bg-muted text-muted-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        success: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400",
        warning: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400",
        info: "bg-sky-500/10 text-sky-600 border-sky-500/20 dark:text-sky-400",
        glass: "bg-white/10 backdrop-blur-md border border-white/20 text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}


export { Badge, badgeVariants }

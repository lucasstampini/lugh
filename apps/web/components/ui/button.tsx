import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-xl border-[1.5px] border-border bg-clip-padding text-[15px] font-extrabold whitespace-nowrap select-none disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // Primário: amarelo com contorno e texto tinta. Um por tela ou seção.
        // No hover continua amarelo cheio, só levanta.
        default: "lift-hard bg-primary text-primary-foreground dark:border-primary",
        // Hover de controle claro é sempre azul elétrico cheio, nunca amarelo.
        outline:
          "lift-hard bg-background text-foreground hover:bg-brand-deep hover:text-white aria-expanded:bg-accent dark:border-input dark:hover:bg-accent dark:hover:text-foreground",
        ink: "lift-hard bg-foreground text-background hover:bg-brand-deep hover:text-white",
        secondary:
          "lift border-transparent bg-secondary text-secondary-foreground hover:bg-accent",
        ghost:
          "lift border-transparent text-foreground hover:bg-accent aria-expanded:bg-accent",
        destructive:
          "lift border-destructive bg-transparent text-destructive hover:bg-destructive-soft",
        link: "border-transparent text-brand-deep underline underline-offset-4",
      },
      size: {
        default:
          "h-11 gap-2 px-[18px] has-data-[icon=inline-end]:pr-3.5 has-data-[icon=inline-start]:pl-3.5",
        xs: "h-7 gap-1 rounded-lg px-2 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 gap-1.5 rounded-[10px] px-3 text-sm [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-[52px] gap-2.5 px-6 text-[17px] [&_svg:not([class*='size-'])]:size-[18px]",
        icon: "size-11",
        "icon-xs": "size-7 rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-9 rounded-[10px]",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }

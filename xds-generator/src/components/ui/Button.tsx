import { forwardRef, type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "default" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantStyle: Record<Variant, string> = {
  primary:
    "bg-[var(--xds-tool-primary)] text-[var(--xds-tool-primary-fg)] hover:bg-[var(--xds-tool-primary-hover)] active:bg-[var(--xds-tool-primary-active)]",
  default:
    "bg-[var(--xds-tool-surface)] text-[var(--xds-tool-text)] border border-[var(--xds-tool-border)] hover:bg-[var(--xds-tool-elevated)]",
  ghost:
    "bg-transparent text-[var(--xds-tool-text)] hover:bg-[var(--xds-tool-elevated)]",
  danger:
    "bg-[var(--xds-tool-danger)] text-white hover:opacity-90",
};

const sizeStyle: Record<Size, string> = {
  sm: "h-7 px-2.5 text-xs",
  md: "h-9 px-3.5 text-sm",
  lg: "h-11 px-4 text-base",
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = "default", size = "md", className = "", children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={[
        "inline-flex items-center justify-center gap-1.5 rounded-md font-medium",
        "transition-colors disabled:opacity-50 disabled:pointer-events-none",
        variantStyle[variant],
        sizeStyle[size],
        className,
      ].join(" ")}
      {...rest}
    >
      {children}
    </button>
  );
});

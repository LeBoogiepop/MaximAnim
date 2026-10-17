import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "quiet" | "ghost" | "danger" | "light" | "overlay";
type Size = "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary: "border-transparent bg-accent text-ink hover:bg-accent/90",
  secondary: "border-line bg-surface text-paper hover:bg-surface/80",
  // A hairline control that sits under the real actions (tracking, following): never competes with them.
  quiet: "border-line bg-transparent text-soft font-medium active:border-accent/60",
  ghost: "border-transparent bg-transparent text-paper",
  danger: "border-transparent bg-coral text-ink",
  light: "border-transparent bg-paper text-ink",
  // Over artwork only: just enough contrast to read the icon.
  overlay: "border-transparent bg-black/40 text-paper backdrop-blur-sm",
};

const SIZES: Record<Size, string> = {
  md: "min-h-11 px-4 text-[15px] gap-2 rounded-[var(--radius-control)]",
  lg: "min-h-12 px-5 text-base gap-2.5 rounded-[var(--radius-control)]",
};

function classes(variant: Variant, size: Size, block?: boolean, extra?: string) {
  return [
    "tactile-press inline-flex select-none items-center justify-center border font-semibold",
    "disabled:opacity-45 disabled:cursor-not-allowed",
    VARIANTS[variant],
    SIZES[size],
    block ? "w-full" : "",
    extra ?? "",
  ].join(" ");
}

interface Common {
  variant?: Variant;
  size?: Size;
  block?: boolean;
  icon?: ReactNode;
  children?: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  block,
  icon,
  children,
  className,
  style,
  type = "button",
  ...rest
}: Common & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={classes(variant, size, block, className)}
      style={style}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  block,
  icon,
  children,
  className,
  style,
  ...rest
}: Common & ComponentProps<typeof Link>) {
  return (
    <Link
      className={classes(variant, size, block, className)}
      style={style}
      {...rest}
    >
      {icon}
      {children}
    </Link>
  );
}

/** 44px icon action — the icon alone, no visible box unless asked; always labelled. */
export function IconButton({
  label,
  children,
  className,
  variant = "ghost",
  type = "button",
  style,
  ...rest
}: { label: string; variant?: Variant } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border active:opacity-60 ${VARIANTS[variant]} disabled:opacity-40 ${className ?? ""}`}
      style={style}
      {...rest}
    >
      {children}
    </button>
  );
}

export function IconLink({
  label,
  children,
  className,
  variant = "ghost",
  style,
  ...rest
}: { label: string; variant?: Variant } & ComponentProps<typeof Link>) {
  return (
    <Link
      aria-label={label}
      title={label}
      className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border active:opacity-60 ${VARIANTS[variant]} ${className ?? ""}`}
      style={style}
      {...rest}
    >
      {children}
    </Link>
  );
}

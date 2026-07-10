import React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import {
  MoroccanLantern,
  MoroccanArch,
  MoroccanScissors,
  MoroccanStar,
} from "@/components/ui/MoroccanIcons";
import { Star } from "lucide-react";

const buttonVariants = cva(
  // Modern, fully rounded, bold, premium button
  "inline-flex items-center justify-center whitespace-nowrap rounded-full text-base font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moroccan-gold focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 shadow-md hover:shadow-lg active:scale-95",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-moroccan-gold/90 hover:text-moroccan-charcoal",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border-2 border-moroccan-gold text-moroccan-gold bg-transparent hover:bg-moroccan-gold hover:text-moroccan-charcoal",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-moroccan-gold/10 hover:text-moroccan-gold",
        link: "text-primary underline-offset-4 hover:underline",
        moroccan: "bg-gradient-to-r from-moroccan-green to-moroccan-gold text-white shadow-moroccan hover:shadow-moroccan-lg hover:scale-105 transition-all duration-300",
        "moroccan-outline": "border-2 border-moroccan-gold text-moroccan-gold bg-transparent hover:bg-moroccan-gold hover:text-moroccan-charcoal shadow-moroccan transition-all duration-300",
        "moroccan-ghost": "text-moroccan-gold hover:bg-moroccan-gold/10 hover:text-moroccan-gold transition-all duration-300",
        "moroccan-dark": "bg-moroccan-charcoal text-moroccan-gold border border-moroccan-gold/30 hover:bg-moroccan-gold hover:text-moroccan-charcoal shadow-moroccan transition-all duration-300",
      },
      size: {
        default: "h-12 px-6 py-3",
        sm: "h-10 rounded-full px-4 text-sm",
        lg: "h-14 rounded-full px-10 text-lg font-bold",
        xl: "h-16 rounded-full px-12 text-xl font-bold",
        icon: "h-12 w-12",
      },
      animation: {
        none: "",
        "gold-glow": "animate-gold-glow",
        pulse: "animate-moroccan-pulse",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      animation: "none",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    animation,
    asChild = false, 
    loading = false,
    icon,
    iconPosition = "left",
    children,
    disabled,
    ...props 
  }, ref) => {
    const Comp = asChild ? Slot : "button";

    // Moroccan icon support
    let iconNode = null;
    if (icon === "moroccan-lantern") iconNode = <MoroccanLantern size={20} />;
    else if (icon === "moroccan-arch") iconNode = <MoroccanArch size={20} />;
    else if (icon === "moroccan-scissors") iconNode = <MoroccanScissors size={20} />;
    else if (icon === "moroccan-star") iconNode = <MoroccanStar size={20} />;
    else iconNode = icon;

    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size, animation, className }),
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-moroccan-gold"
        )}
        ref={ref}
        disabled={disabled || loading}
        {...props}
        tabIndex={0}
        aria-label={props['aria-label'] || 'Bouton'}
      >
        {loading && (
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        )}
        {iconNode && iconPosition === "left" && !loading && iconNode}
        {children}
        {iconNode && iconPosition === "right" && !loading && iconNode}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export const ThemeToggle: React.FC = () => {
  const [dark, setDark] = React.useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  React.useEffect(() => {
    if (dark) {
      document.body.classList.add('dark');
      document.body.classList.remove('light');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark');
      document.body.classList.add('light');
      localStorage.setItem('theme', 'light');
    }
  }, [dark]);

  return (
    <button
      type="button"
      aria-label="Toggle dark mode"
      className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 text-yellow-400 dark:text-blue-300 transition"
      onClick={() => setDark((d) => !d)}
    >
      {dark ? <Star className="h-5 w-5" /> : <Star className="h-5 w-5" />}
    </button>
  );
};

export { Button, buttonVariants };

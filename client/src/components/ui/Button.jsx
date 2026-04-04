import { forwardRef } from "react";
import { cn } from "../../utils/cn";
import { motion } from "framer-motion";

const Button = forwardRef(({ className, variant = "primary", size = "default", children, ...props }, ref) => {
  const baseStyles = "inline-flex items-center justify-center font-heading font-bold transition-all focus:outline-none disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    primary: "bg-gradient-to-br from-primary to-primary-container text-on-primary-fixed hover:brightness-110",
    secondary: "bg-transparent border border-outline-variant/20 text-primary hover:bg-surface-container/50",
    tertiary: "bg-surface-container-highest text-white hover:bg-surface-variant",
  };

  const sizes = {
    default: "h-12 px-6 rounded-xl text-base",
    sm: "h-9 px-4 rounded-lg text-sm",
    lg: "h-14 px-8 rounded-2xl text-lg",
    icon: "h-12 w-12 rounded-full",
  };

  return (
    <motion.button
      ref={ref}
      whileTap={{ scale: 0.97 }}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </motion.button>
  );
});

Button.displayName = "Button";

export { Button };

import { forwardRef } from "react";
import { cn } from "../../utils/cn";
import { motion } from "framer-motion";

const Card = forwardRef(({ className, children, is3D = false, ...props }, ref) => {
  return (
    <motion.div
      ref={ref}
      className={cn(
        "bg-surface-container rounded-2xl overflow-hidden relative",
        is3D ? "border-t border-t-outline-variant/15 shadow-glass transform-gpu hover:-translate-y-1 transition-transform duration-300" : "border border-outline-variant/15",
        className
      )}
      style={is3D ? { perspective: "1000px", rotateX: "2deg" } : {}}
      {...props}
    >
      {/* Optional Top ambient glow for 3D cards */}
      {is3D && (
        <div className="absolute top-0 left-0 right-0 h-[100px] bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
      )}
      {children}
    </motion.div>
  );
});

Card.displayName = "Card";

export { Card };

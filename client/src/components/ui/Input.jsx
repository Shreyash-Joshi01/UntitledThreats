import { forwardRef } from "react";
import { cn } from "../../utils/cn";

const Input = forwardRef(({ className, error, ...props }, ref) => {
  return (
    <div className="w-full relative">
      <input
        ref={ref}
        className={cn(
          "w-full bg-surface-container-highest border-transparent rounded-lg px-4 py-3.5 text-on-surface font-body outline-none transition-all",
          "focus:border focus:border-primary/50 focus:shadow-[0_0_12px_rgba(57,255,20,0.2)]",
          "placeholder:text-on-surface-variant",
          error && "bg-error-container/10 border-error text-error placeholder:text-error/70",
          className
        )}
        {...props}
      />
      {error && (
        <p className="absolute -bottom-6 left-0 text-error text-xs font-body mt-1">
          {error}
        </p>
      )}
    </div>
  );
});

Input.displayName = "Input";

export { Input };


import { useToast } from "@/hooks/use-toast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, action, variant, ...props }) => (
        <Toast
          key={id}
          className={`
            bg-white text-dark rounded-lg p-4 shadow-lg
            ${variant === 'destructive' ? 'border-l-4 border-red-500' : ''}
          `}
          {...props}
        >
          <div className="grid gap-1">
            {title && <ToastTitle className={variant === 'destructive' ? 'text-red-600' : ''}>{title}</ToastTitle>}
            {description && <ToastDescription>{description}</ToastDescription>}
          </div>
          {action}
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  );
}

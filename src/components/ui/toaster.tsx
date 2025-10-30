import { useToast } from "@/hooks/use-toast";
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast";

export function Toaster() {
  const { toasts, pauseAutoDismiss, resumeAutoDismiss } = useToast();

  return (
    <ToastProvider duration={86400000}>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        const duration = props.duration ?? 3000;
        return (
          <Toast
            key={id}
            {...props}
            duration={86400000}
            onMouseEnter={() => pauseAutoDismiss(id)}
            onMouseLeave={() => resumeAutoDismiss(id, duration)}
          >
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && <ToastDescription>{description}</ToastDescription>}
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}

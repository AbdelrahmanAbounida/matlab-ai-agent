import { toast } from "sonner";

type Position =
  | "top-left"
  | "top-right"
  | "top-center"
  | "bottom-left"
  | "bottom-right"
  | "bottom-center";

interface ToastContent {
  title: string;
  description: string;
  position?: Position;
  richColors?: boolean;
  actionButton?: React.ReactNode;
  duration?: number;
}

const CloseButton = () => (
  <button
    onClick={(e) => {
      e.stopPropagation();
      toast.dismiss();
    }}
    className="absolute right-2.5 top-1.5 dark:text-white hover:text-gray-300"
  >
    ✕
  </button>
);

export const showSuccessToast = (
  { title, description, position, duration }: ToastContent,
  options?: Parameters<typeof toast.success>[1]
) => {
  toast.success(
    <div className="flex flex-col gap-1" onClick={(e) => e.stopPropagation()}>
      <CloseButton />
      <p className="font-semibold text-black dark:text-white">{title}</p>
      <p className="text-sm text-muted-foreground wrap-break-word">
        {description}
      </p>
    </div>,
    {
      position: position || "bottom-right",
      style: { pointerEvents: "auto" },
      duration: duration || 7000,
      ...options,
    }
  );
};

export const showErrorToast = (
  {
    title,
    description,
    position,
    richColors,
    actionButton,
    duration,
  }: ToastContent,
  options?: Parameters<typeof toast.error>[1]
) => {
  return toast.error(
    <div
      className="flex flex-col gap-2"
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      <CloseButton />

      <p className="font-semibold text-black dark:text-white">{title}</p>
      <p className="text-sm text-muted-foreground wrap-break-words">
        {description}
      </p>

      {actionButton && (
        <div
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          {actionButton}
        </div>
      )}
    </div>,
    {
      position: position || "bottom-right",
      richColors,
      duration: duration || 7000,
      style: { pointerEvents: "auto" },
      ...options,
    }
  );
};

export const showInfoToast = (
  { title, description, position }: ToastContent,
  options?: Parameters<typeof toast.info>[1]
) => {
  toast.info(
    <div className="flex flex-col gap-1" onClick={(e) => e.stopPropagation()}>
      <CloseButton />

      <p className="font-semibold text-black dark:text-white">{title}</p>
      <p className="text-sm text-muted-foreground wrap-break-word">
        {description}
      </p>
    </div>,
    {
      position: position || "bottom-right",
      style: { pointerEvents: "auto" },
      ...options,
    }
  );
};

export const showWarningToast = (
  { title, description, position }: ToastContent,
  options?: Parameters<typeof toast.warning>[1]
) => {
  toast.warning(
    <div className="flex flex-col gap-1" onClick={(e) => e.stopPropagation()}>
      <CloseButton />

      <p className="font-semibold text-black dark:text-white">{title}</p>
      <p className="text-sm text-muted-foreground wrap-break-word">
        {description}
      </p>
    </div>,
    {
      position: position || "bottom-right",
      style: { pointerEvents: "auto" },
      ...options,
    }
  );
};
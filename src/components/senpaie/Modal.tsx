import { ReactNode } from "react";

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  width?: number;
}

export function Modal({ title, onClose, children, width = 720 }: ModalProps) {
  return (
    <div
      className="fixed inset-0 bg-black/80 z-[999] flex items-center justify-center p-5"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-card border border-border rounded-2xl w-full flex flex-col max-h-[92vh] overflow-y-auto scrollbar-thin"
        style={{ maxWidth: width }}
      >
        <div className="px-7 py-4 border-b border-border flex justify-between items-center sticky top-0 bg-card z-10 rounded-t-2xl">
          <div className="text-foreground font-bold text-[15px]">{title}</div>
          <button
            onClick={onClose}
            className="bg-transparent border-none text-muted-foreground cursor-pointer text-xl leading-none p-1 hover:text-foreground transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="px-7 py-5">{children}</div>
      </div>
    </div>
  );
}

interface FieldProps {
  label: string;
  children: ReactNode;
}

export function Field({ label, children }: FieldProps) {
  return (
    <div className="mb-3.5">
      <label className="text-muted-foreground text-[11px] block mb-1.5 uppercase tracking-wide">
        {label}
      </label>
      {children}
    </div>
  );
}

export const inputClass = "w-full py-2.5 px-3 bg-background border border-border rounded-lg text-foreground text-[13px] font-mono outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors";

export default Modal;

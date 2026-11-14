import { useEffect, useId, useRef } from 'react';

export interface ModalProps {
  title: string;
  closeLabel: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  testId?: string;
}

const FOCUSABLE = 'button:not([disabled]), a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/** پنجرهٔ گفت‌وگوی سادهٔ برنامه (بدون کتابخانهٔ UI): Escape، کلیک بیرون و چرخهٔ Tab. */
export function Modal({
  title,
  closeLabel,
  onClose,
  children,
  footer,
  testId,
}: ModalProps): React.JSX.Element {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    dialog?.focus();

    // فوکوس درون پنجره می‌ماند (مثلاً وقتی منوی بسته‌شده فوکوس را به دکمهٔ خودش برمی‌گرداند).
    const onFocusIn = (event: FocusEvent): void => {
      if (dialog && event.target instanceof Node && !dialog.contains(event.target)) {
        dialog.focus();
      }
    };
    // کلیدهایی که بیرون از پنجره زده می‌شوند نباید به تخته برسند؛ Escape همیشه می‌بندد.
    const onWindowKeyDown = (event: KeyboardEvent): void => {
      if (dialog && event.target instanceof Node && dialog.contains(event.target)) {
        return;
      }
      event.stopPropagation();
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
      } else if (event.key === 'Tab') {
        event.preventDefault();
        dialog?.focus();
      }
    };
    document.addEventListener('focusin', onFocusIn);
    window.addEventListener('keydown', onWindowKeyDown, true);
    return () => {
      document.removeEventListener('focusin', onFocusIn);
      window.removeEventListener('keydown', onWindowKeyDown, true);
      previous?.focus?.();
    };
  }, []);

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    // کلیدها نباید به تخته (میان‌برهای ابزار) برسند.
    event.stopPropagation();
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== 'Tab' || !dialogRef.current) {
      return;
    }
    const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (focusable.length === 0) {
      event.preventDefault();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;
    if (event.shiftKey && (active === first || active === dialogRef.current)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <div
      className="zn-modal-backdrop"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        className="zn-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        data-testid={testId}
        onKeyDown={onKeyDown}
      >
        <header className="zn-modal__header">
          <h2 id={titleId} className="zn-modal__title">
            {title}
          </h2>
          <button
            type="button"
            className="zn-icon-button"
            aria-label={closeLabel}
            title={closeLabel}
            data-testid="modal-close"
            onClick={onClose}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </header>
        <div className="zn-modal__body">{children}</div>
        {footer && <footer className="zn-modal__footer">{footer}</footer>}
      </div>
    </div>
  );
}

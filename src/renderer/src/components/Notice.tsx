import { FilePath } from './FilePath';

export type NoticeKind = 'info' | 'success' | 'error';

export interface NoticeData {
  id: number;
  kind: NoticeKind;
  message: string;
  detail?: string;
}

/** پیام کوتاه پایین صفحه (ذخیره شد، خطا در باز کردن و …). */
export function Notice({
  notice,
  closeLabel,
  onDismiss,
}: {
  notice: NoticeData;
  closeLabel: string;
  onDismiss: () => void;
}): React.JSX.Element {
  return (
    <div className="zn-notice-wrapper">
      <div
        className={`zn-notice zn-notice--${notice.kind}`}
        role={notice.kind === 'error' ? 'alert' : 'status'}
        data-testid="app-notice"
      >
        <div className="zn-notice__text">
          <div className="zn-notice__message">{notice.message}</div>
          {notice.detail && <FilePath className="zn-notice__detail" path={notice.detail} />}
        </div>
        <button
          type="button"
          className="zn-icon-button"
          aria-label={closeLabel}
          title={closeLabel}
          onClick={onDismiss}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}

import type { RecentFile, UiLanguage } from '@shared/ipc';
import { formatDate } from '@shared/dates';
import { fileDirectory, fileDisplayName } from '../document';
import { getStrings } from '../strings';
import { FilePath } from './FilePath';
import { Modal } from './Modal';

export interface RecentFilesDialogProps {
  language: UiLanguage;
  files: RecentFile[];
  onOpen: (filePath: string) => void;
  onRemove: (filePath: string) => void;
  onClear: () => void;
  onClose: () => void;
}

/** فهرست پرونده‌های اخیر با تاریخ شمسی (در زبان فارسی). */
export function RecentFilesDialog({
  language,
  files,
  onOpen,
  onRemove,
  onClear,
  onClose,
}: RecentFilesDialogProps): React.JSX.Element {
  const s = getStrings(language);
  return (
    <Modal
      title={s.recent.title}
      closeLabel={s.close}
      onClose={onClose}
      testId="recent-dialog"
      footer={
        <>
          {files.length > 0 && (
            <button type="button" className="zn-button" data-testid="recent-clear" onClick={onClear}>
              {s.recent.clear}
            </button>
          )}
          <button type="button" className="zn-button zn-button--primary" onClick={onClose}>
            {s.close}
          </button>
        </>
      }
    >
      {files.length === 0 ? (
        <p className="zn-recent__empty" data-testid="recent-empty">
          {s.recent.empty}
          <br />
          {s.recent.emptyHint}
        </p>
      ) : (
        <ul className="zn-recent__list">
          {files.map((file) => {
            const name = fileDisplayName(file.path, file.name);
            return (
            <li key={file.path} className="zn-recent__item" data-testid="recent-item">
              <button
                type="button"
                className="zn-recent__open"
                title={file.path}
                aria-label={`${s.recent.open}: ${name}`}
                onClick={() => onOpen(file.path)}
              >
                <bdi className="zn-recent__name">{name}</bdi>
                <span className="zn-recent__meta">
                  <FilePath className="zn-recent__path" path={fileDirectory(file.path)} />
                  <time className="zn-recent__date" dateTime={file.openedAt}>
                    {formatDate(file.openedAt, language)}
                  </time>
                </span>
              </button>
              <button
                type="button"
                className="zn-icon-button"
                title={s.recent.remove}
                aria-label={`${s.recent.remove}: ${name}`}
                data-testid="recent-remove"
                onClick={() => onRemove(file.path)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </svg>
              </button>
            </li>
            );
          })}
        </ul>
      )}
    </Modal>
  );
}

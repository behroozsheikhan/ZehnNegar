import { UPSTREAM_URL, type AppInfo, type UiLanguage } from '@shared/ipc';
import { formatDigits } from '@shared/digits';
import { getStrings } from '../strings';
import { AppLogo } from './AppLogo';
import { Modal } from './Modal';

export interface AboutDialogProps {
  language: UiLanguage;
  info: AppInfo | null;
  onClose: () => void;
}

/** «درباره»: معرفی قابلیت‌ها و قدردانی از پروژهٔ اصلی Drawnix. */
export function AboutDialog({ language, info, onClose }: AboutDialogProps): React.JSX.Element {
  const s = getStrings(language);
  const version = info ? formatDigits(info.version, language) : '';
  return (
    <Modal
      title={s.about.title}
      closeLabel={s.close}
      onClose={onClose}
      testId="about-dialog"
      footer={
        <button type="button" className="zn-button zn-button--primary" onClick={onClose}>
          {s.close}
        </button>
      }
    >
      <div className="zn-about__brand">
        <AppLogo className="zn-about__logo" />
        <div>
          <h3 className="zn-about__name">{s.appName}</h3>
          <p className="zn-about__version" data-testid="about-version">
            {s.about.version} <bdi>{version}</bdi>
          </p>
        </div>
      </div>
      <p>{s.tagline}</p>

      <h4 className="zn-about__section-title">{s.about.featuresTitle}</h4>
      <ul className="zn-about__features">
        {s.about.features.map((feature) => (
          <li key={feature}>{feature}</li>
        ))}
      </ul>

      <h4 className="zn-about__section-title">{s.about.creditTitle}</h4>
      <p className="zn-about__credit" data-testid="about-credit">
        {s.about.creditBefore}{' '}
        {/* پیوند بیرونی: main آن را در مرورگر پیش‌فرض سیستم باز می‌کند، نه داخل برنامه. */}
        <a className="zn-link" href={UPSTREAM_URL} target="_blank" rel="noreferrer">
          <bdi>{s.about.creditLink}</bdi>
        </a>{' '}
        {s.about.creditAfter}
        <br />
        {s.about.license}
        <br />
        {s.about.fontCredit}
      </p>

      {info && (
        <p className="zn-about__tech">
          {s.about.tech}:{' '}
          <bdi>
            Electron {info.electron} · Chromium {info.chrome} · Node {info.node}
          </bdi>
        </p>
      )}
    </Modal>
  );
}

import { DEFAULT_SETTINGS, type Settings, type UiLanguage } from '../../shared/ipc';
import type { Repository } from './repository';

const SETTINGS_KEY = 'settings';

export function isUiLanguage(value: unknown): value is UiLanguage {
  return value === 'fa' || value === 'en';
}

/** ورودی نامطمئن (از دیتابیس یا renderer) را به تنظیمات معتبر تبدیل می‌کند. */
export function sanitizeSettings(raw: unknown, base: Settings = DEFAULT_SETTINGS): Settings {
  const input = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  return {
    language: isUiLanguage(input.language) ? input.language : base.language,
    copyTransparent:
      typeof input.copyTransparent === 'boolean' ? input.copyTransparent : base.copyTransparent,
    exportTransparent:
      typeof input.exportTransparent === 'boolean' ? input.exportTransparent : base.exportTransparent,
    toolState: isPlainJson(input.toolState) ? input.toolState : base.toolState,
  };
}

function isPlainJson(value: unknown): boolean {
  if (value === undefined || typeof value === 'function' || typeof value === 'symbol') {
    return false;
  }
  try {
    return JSON.stringify(value).length <= 64 * 1024;
  } catch {
    return false;
  }
}

export class SettingsService {
  constructor(private readonly repository: Repository) {}

  get(): Settings {
    const stored = this.repository.getSetting(SETTINGS_KEY);
    if (!stored) {
      return { ...DEFAULT_SETTINGS };
    }
    try {
      return sanitizeSettings(JSON.parse(stored));
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }

  update(patch: unknown): Settings {
    const current = this.get();
    const merged =
      typeof patch === 'object' && patch !== null
        ? { ...current, ...(patch as Record<string, unknown>) }
        : current;
    const next = sanitizeSettings(merged, current);
    this.repository.setSetting(SETTINGS_KEY, JSON.stringify(next));
    return next;
  }
}

#!/usr/bin/env bash
# آماده‌سازی محیط توسعه/تست (لینوکس: sandbox و CI). چند بار اجرا کردنش بی‌خطر است (idempotent).
#
#   1) کتابخانه‌های سیستمیِ لازم برای اجرای Electron + xvfb
#   2) npm ci
#   3) electron-rebuild برای better-sqlite3
#   4) آزمون سلامت: electron --version --no-sandbox
#
# هر فرمان Electron با `env -u NODE_OPTIONS` اجرا می‌شود.
set -euo pipefail

cd "$(dirname "$0")/.."

APT_PACKAGES=(
  xvfb xauth
  libgtk-3-0 libnss3 libnspr4 libgbm1 libasound2 libatk1.0-0 libatk-bridge2.0-0
  libcups2 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2
  libpango-1.0-0 libcairo2 libx11-xcb1 libxshmfence1
)

log() { printf '\n[bootstrap] %s\n' "$*"; }
warn() { printf '\n[bootstrap] WARNING: %s\n' "$*" >&2; }

# ---------- 1) کتابخانه‌های سیستمی ----------
missing=()
if command -v dpkg-query >/dev/null 2>&1; then
  for pkg in "${APT_PACKAGES[@]}"; do
    # در اوبونتو ۲۴ برخی بسته‌ها پسوند t64 دارند (libasound2t64 و …).
    if ! dpkg-query -W -f='${Status}' "$pkg" 2>/dev/null | grep -q 'install ok installed' &&
      ! dpkg-query -W -f='${Status}' "${pkg}t64" 2>/dev/null | grep -q 'install ok installed'; then
      missing+=("$pkg")
    fi
  done
fi

if [ "${#missing[@]}" -eq 0 ]; then
  log "system libraries already installed"
elif command -v apt-get >/dev/null 2>&1; then
  log "installing system libraries: ${missing[*]}"
  SUDO=""
  if [ "$(id -u)" -ne 0 ]; then SUDO="sudo"; fi
  export DEBIAN_FRONTEND=noninteractive
  apt_ok=1
  $SUDO apt-get update -o Acquire::Retries=1 -o Acquire::http::Timeout=20 || apt_ok=0
  if [ "$apt_ok" -eq 1 ]; then
    for pkg in "${missing[@]}"; do
      $SUDO apt-get install -y --no-install-recommends "$pkg" ||
        $SUDO apt-get install -y --no-install-recommends "${pkg}t64" ||
        { warn "could not install $pkg"; apt_ok=0; }
    done
  fi
  if [ "$apt_ok" -ne 1 ]; then
    warn "apt is not fully available here; Electron-based steps (test:db, test:e2e) may only run in CI"
  fi
else
  warn "apt-get not found; install manually: ${missing[*]}"
fi

# ---------- 2) وابستگی‌های npm ----------
log "npm ci"
if ! npm ci --no-audit --no-fund; then
  # اگر دانلود باینری Electron ممکن نباشد (شبکهٔ محدود)، بقیهٔ ابزارها همچنان نصب می‌شوند.
  warn "npm ci failed; retrying without the Electron binary download"
  ELECTRON_SKIP_BINARY_DOWNLOAD=1 npm ci --no-audit --no-fund
fi

# ---------- 3) ماژول نیتیو برای ABI الکترون ----------
ELECTRON_BIN="node_modules/electron/dist/electron"
if [ -x "$ELECTRON_BIN" ]; then
  # better-sqlite3 باینری آمادهٔ N-API دارد (مستقل از ABI الکترون) و binding.gyp آن در صورت
  # وجود باینری آماده چیزی کامپایل نمی‌کند؛ پس شکست این گام کشنده نیست. معیار واقعی آزمون
  # بارگذاری ماژول درون Electron در گام بعد است.
  log "electron-rebuild -f -w better-sqlite3"
  if ! env -u NODE_OPTIONS npx electron-rebuild -f -w better-sqlite3; then
    warn "electron-rebuild failed; relying on the N-API prebuilt binary"
  fi

  log "better-sqlite3 inside Electron"
  env -u NODE_OPTIONS ELECTRON_RUN_AS_NODE=1 "$ELECTRON_BIN" -e \
    "const D=require('better-sqlite3');const d=new D(':memory:');console.log('sqlite', d.prepare('select sqlite_version() v').get().v, 'electron', process.versions.electron);d.close()"

  # ---------- 4) آزمون سلامت ----------
  log "electron --version"
  env -u NODE_OPTIONS npx electron --version --no-sandbox
else
  warn "Electron binary is not installed; skipped electron-rebuild and the version check"
fi

log "done"

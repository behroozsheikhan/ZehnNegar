import React from 'react';
import { ChevronRightIcon } from '../icons';

const MenuItemContent = ({
  icon,
  shortcut,
  children,
  hasSubmenu,
}: {
  icon?: React.ReactNode;
  shortcut?: string;
  children: React.ReactNode;
  hasSubmenu?: boolean;
}) => {
  return (
    <>
      {icon && <div className="menu-item__left">{icon}</div>}
      <div className="menu-item__text">{children}</div>
      {(shortcut || hasSubmenu) && (
        <div className="menu-item__right">
          {/* میان‌بر همیشه چپ‌به‌راست است تا «Ctrl+=» در منوی فارسی به‌هم نریزد. */}
          {shortcut && (
            <div className="menu-item__shortcut" dir="ltr">
              {shortcut}
            </div>
          )}
          {hasSubmenu && <div className="menu-item__submenu-indicator">{ChevronRightIcon}</div>}
        </div>
      )}
    </>
  );
};
export default MenuItemContent;

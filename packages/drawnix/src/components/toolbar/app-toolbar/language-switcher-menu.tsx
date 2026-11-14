import { useContext } from 'react';
import { LanguageIcon } from '../../icons';
import { useI18n } from '../../../i18n';
import Menu from '../../menu/menu';
import MenuItem from '../../menu/menu-item';
import { MenuContentPropsContext } from '../../menu/common';
import { EVENT } from '../../../constants';

export const LanguageSwitcherMenu = () => {
  const { language, setLanguage, t } = useI18n();
  const menuContentProps = useContext(MenuContentPropsContext);

  return (
    <MenuItem
      icon={LanguageIcon}
      data-testid="language-switcher-button"
      onSelect={() => {
        // This will be handled by the submenu
      }}
      submenu={
        <Menu
          onSelect={() => {
            const itemSelectEvent = new CustomEvent(EVENT.MENU_ITEM_SELECT, {
              bubbles: true,
              cancelable: true,
            });
            menuContentProps.onSelect?.(itemSelectEvent);
          }}
        >
          <MenuItem
            data-testid="language-fa"
            onSelect={() => {
              setLanguage('fa');
            }}
            aria-label={t('language.persian')}
            selected={language === 'fa'}
          >
            {t('language.persian')}
          </MenuItem>
          <MenuItem
            data-testid="language-en"
            onSelect={() => {
              setLanguage('en');
            }}
            aria-label={t('language.english')}
            selected={language === 'en'}
          >
            {t('language.english')}
          </MenuItem>
        </Menu>
      }
      aria-label={t('language.switcher')}
    >
      {t('language.switcher')}
    </MenuItem>
  );
};

LanguageSwitcherMenu.displayName = 'LanguageSwitcherMenu';

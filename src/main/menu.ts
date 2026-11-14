/**
 * تبدیل مدل منو (core/menu-model) به منوی نیتیو Electron.
 */
import { Menu, type MenuItemConstructorOptions } from 'electron';
import type { AppCommand } from '../shared/ipc';
import type { MenuNode } from './core/menu-model';

export interface MenuActions {
  runCommand(command: AppCommand): void;
  openPath(filePath: string): void;
}

function toTemplate(node: MenuNode, actions: MenuActions): MenuItemConstructorOptions {
  if (node.type === 'separator') {
    return { type: 'separator' };
  }
  const item: MenuItemConstructorOptions = { id: node.id, label: node.label };
  if (node.enabled === false) {
    item.enabled = false;
  }
  if (node.submenu) {
    item.submenu = node.submenu.map((child) => toTemplate(child, actions));
    return item;
  }
  if (node.role) {
    item.role = node.role;
    return item;
  }
  if (node.accelerator) {
    item.accelerator = node.accelerator;
    // میان‌برها را خود renderer مدیریت می‌کند (تا هنگام ویرایش متن با رفتار ویرایشگر تداخل نکند)؛
    // اینجا فقط نمایش داده می‌شوند.
    item.registerAccelerator = false;
  }
  if (node.command) {
    const command = node.command;
    item.click = () => actions.runCommand(command);
  } else if (node.openPath) {
    const filePath = node.openPath;
    item.click = () => actions.openPath(filePath);
  }
  return item;
}

export function buildNativeMenu(model: readonly MenuNode[], actions: MenuActions): Menu {
  return Menu.buildFromTemplate(model.map((node) => toTemplate(node, actions)));
}

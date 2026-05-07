import { useEffect } from 'react';

/**
 * useKeyboardShortcuts - register global keyboard shortcuts.
 * @param {Array<{key: string, ctrlKey?: boolean, metaKey?: boolean, shiftKey?: boolean, handler: function, description: string}>} shortcuts
 */
export function useKeyboardShortcuts(shortcuts) {
  useEffect(() => {
    const handler = (e) => {
      // Don't trigger shortcuts when typing in inputs/textareas
      const tag = e.target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || e.target?.isContentEditable) return;

      for (const shortcut of shortcuts) {
        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = shortcut.ctrlKey ? (e.ctrlKey || e.metaKey) : !e.ctrlKey && !e.metaKey;
        const shiftMatch = shortcut.shiftKey ? e.shiftKey : !e.shiftKey;
        const metaMatch = shortcut.metaKey ? e.metaKey : true;

        // For simple key shortcuts, also reject when Alt is pressed
        const isSimpleKey = !shortcut.ctrlKey && !shortcut.metaKey && !shortcut.shiftKey;
        if (isSimpleKey && e.altKey) continue;

        if (keyMatch && ctrlMatch && shiftMatch && metaMatch) {
          e.preventDefault();
          shortcut.handler(e);
          break;
        }
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [shortcuts]);
}

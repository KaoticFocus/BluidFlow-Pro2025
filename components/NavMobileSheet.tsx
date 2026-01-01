import React, { useEffect } from 'react';
import { lockBodyScroll, unlockBodyScroll } from '../utils/bodyScrollLock';

export type NavMobileSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children?: React.ReactNode;
};

/*
  Mobile navigation bottom sheet (scaffold)
  - Not wired by default. Import and render in your layout when on small screens.
  - Provides backdrop, ESC/backdrop close, and body scroll lock.
  - For full a11y focus trapping, integrate your dialog/sheet component or a focus-trap util.
*/
export default function NavMobileSheet({ isOpen, onClose, title = 'Menu', children }: NavMobileSheetProps) {
  useEffect(() => {
    if (isOpen) lockBodyScroll();
    else unlockBodyScroll();
    return () => unlockBodyScroll();
  }, [isOpen]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    if (isOpen) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div role="dialog" aria-modal="true" aria-label={title} className="nms-root">
      <div className="nms-backdrop" onClick={onClose} />
      <div className="nms-panel" role="document">
        <div className="nms-header">
          <span className="nms-title">{title}</span>
          <button className="nms-close" aria-label="Close" onClick={onClose}>✕</button>
        </div>
        <div className="nms-content">{children}</div>
      </div>
      <style jsx>{`
        .nms-root { position: fixed; inset: 0; z-index: 60; }
        .nms-backdrop { position: absolute; inset: 0; background: rgba(0,0,0,0.5); }
        .nms-panel {
          position: absolute; left: 0; right: 0; bottom: 0;
          background: var(--sheet-bg, #fff);
          color: var(--sheet-fg, inherit);
          border-top-left-radius: 16px; border-top-right-radius: 16px;
          box-shadow: 0 -10px 30px rgba(0,0,0,0.2);
          padding-bottom: env(safe-area-inset-bottom);
          max-height: min(80vh, 640px);
          display: flex; flex-direction: column;
          animation: nms-slide-up 160ms ease-out;
        }
        .nms-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 16px; border-bottom: 1px solid rgba(0,0,0,0.06);
        }
        .nms-title { font-weight: 600; }
        .nms-close {
          width: 44px; height: 44px; display: inline-flex; align-items: center; justify-content: center;
          background: transparent; border: none; cursor: pointer; border-radius: 8px;
        }
        .nms-close:focus-visible { outline: 2px solid #4c8bf5; outline-offset: 2px; }
        .nms-content { padding: 8px 16px 16px; overflow: auto; }
        @keyframes nms-slide-up { from { transform: translateY(8%); opacity: 0.9; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
    </div>
  );
}

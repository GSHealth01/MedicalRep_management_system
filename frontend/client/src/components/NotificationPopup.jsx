import React, { useState, useEffect, useRef } from 'react';

// ─── Toast UI ──────────────────────────────────────────────────────────────────
const TOAST_STYLES = `
  @keyframes toastIn  { from { transform: translateX(110%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
  @keyframes toastOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(110%); opacity: 0; } }
  .toast-in  { animation: toastIn  0.35s cubic-bezier(0.16,1,0.3,1) forwards; }
  .toast-out { animation: toastOut 0.28s cubic-bezier(0.4,0,1,1)   forwards; }
`;

const BORDER_CLASS = { success: 'border-emerald-500', error: 'border-rose-500', warning: 'border-amber-500', info: 'border-sky-500' };

const ICONS = {
  success: <svg className="w-5 h-5 text-emerald-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  error:   <svg className="w-5 h-5 text-rose-500   shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  warning: <svg className="w-5 h-5 text-amber-500  shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
  info:    <svg className="w-5 h-5 text-sky-500    shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
};

function ToastCard({ message, type = 'success', onClose }) {
  const [cls, setCls] = useState('toast-in');

  const dismiss = () => {
    setCls('toast-out');
    setTimeout(onClose, 280);
  };

  return (
    <>
      <style>{TOAST_STYLES}</style>
      <div
        className={`fixed top-5 right-5 z-[9999] flex items-start gap-3 bg-white border-l-4 rounded-xl px-4 py-3 w-[340px] ${cls} ${BORDER_CLASS[type] || BORDER_CLASS.success}`}
        style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.13)' }}
      >
        <div className="mt-0.5">{ICONS[type] || ICONS.success}</div>
        <p className="flex-1 text-sm font-medium text-gray-800 leading-snug">{message}</p>
        <button onClick={dismiss} className="text-gray-400 hover:text-gray-600 transition-colors p-0.5 rounded hover:bg-gray-100 shrink-0">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </>
  );
}

// ─── Hook ──────────────────────────────────────────────────────────────────────
// useNotification returns:
//   • showNotification(msg, type, duration) — triggers the toast
//   • NotificationComponent                — a ready-to-render JSX element
//                                            use as {NotificationComponent} in JSX
// All pages that previously used <NotificationComponent /> must switch to
// {NotificationComponent} — see the fix in ManageDistributors, etc.
export const useNotification = () => {
  const [toast, setToast] = useState(null);   // null | { id, message, type, duration }
  const timerRef = useRef(null);

  const showNotification = (message, type = 'success', duration = 3500) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    // Give a tiny gap so rapid re-calls always re-mount the card
    setToast(null);
    setTimeout(() => {
      const id = Date.now();
      setToast({ id, message, type, duration });
      if (duration > 0) {
        timerRef.current = setTimeout(() => setToast(null), duration);
      }
    }, 20);
  };

  const hideNotification = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast(null);
  };

  // JSX element — use as {NotificationComponent} (not <NotificationComponent />)
  const NotificationComponent = toast
    ? <ToastCard key={toast.id} message={toast.message} type={toast.type} onClose={hideNotification} />
    : null;

  return { showNotification, hideNotification, NotificationComponent };
};

// Legacy default export kept for any direct <NotificationPopup> usage
export default function NotificationPopup({ show, message, type = 'success', duration = 3500, onClose }) {
  const timerRef = useRef(null);
  const [visible, setVisible] = useState(show);

  useEffect(() => {
    setVisible(show);
    if (show && duration > 0) {
      timerRef.current = setTimeout(() => { setVisible(false); onClose && onClose(); }, duration);
    }
    return () => clearTimeout(timerRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  if (!visible) return null;
  return <ToastCard message={message} type={type} onClose={() => { setVisible(false); onClose && onClose(); }} />;
}
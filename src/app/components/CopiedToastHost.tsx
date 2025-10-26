'use client';

import React from 'react';
import CopiedToast from './CopiedToast';

/**
 * Global host that listens for window events and shows the CopiedToast.
 * Anywhere in your app you can call:
 *   window.dispatchEvent(new CustomEvent('copied-toast'));
 * …and this host will display the toast.
 */
export default function CopiedToastHost() {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const onShow = () => setOpen(true);
    window.addEventListener('copied-toast', onShow as EventListener);
    return () => window.removeEventListener('copied-toast', onShow as EventListener);
  }, []);

  return <CopiedToast open={open} onOpenChange={setOpen} />;
}

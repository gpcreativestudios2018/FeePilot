'use client';

export default async function copyWithToast(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    // Tell our CopiedToastHost to show the toast
    window.dispatchEvent(new CustomEvent('copied-toast'));
    return true;
  } catch (err) {
    console.error('Copy failed:', err);
    return false;
  }
}

'use client';

import React from 'react';

const EMAIL = 'gpcreativestudios2018@gmail.com';

export default function Footer() {
  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
      // show a tiny, inline “email copied” bubble
      const id = 'email-copied-toast';
      let el = document.getElementById(id);
      if (!el) {
        el = document.createElement('div');
        el.id = id;
        el.style.position = 'fixed';
        el.style.bottom = '18px';
        el.style.right = '18px';
        el.style.padding = '10px 14px';
        el.style.borderRadius = '10px';
        el.style.background = 'rgba(147, 51, 234, 0.95)'; // purple-ish
        el.style.color = 'white';
        el.style.fontSize = '14px';
        el.style.boxShadow = '0 6px 22px rgba(0,0,0,.35)';
        el.style.zIndex = '9999';
        el.style.transition = 'opacity .2s ease';
        document.body.appendChild(el);
      }
      el.textContent = 'Email copied';
      el.style.opacity = '1';
      setTimeout(() => (el.style.opacity = '0'), 1100);
    } catch {
      // fallback: open mail client if clipboard is blocked
      window.location.href = `mailto:${EMAIL}`;
    }
  };

  return (
    <div className="mt-10 flex items-center justify-center text-sm text-neutral-400">
      <span className="mr-2">FeePilot by GP Creative Studios</span>
      <button
        onClick={copyEmail}
        className="rounded-md px-2 py-1 text-purple-300 hover:text-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
        aria-label="Copy email address"
      >
        (contact)
      </button>
    </div>
  );
}

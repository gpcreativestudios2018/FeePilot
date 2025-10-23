// src/app/components/ThemeToggle.tsx
"use client";

import React from "react";
import { actionButtonClass } from "./HeaderActions";

type Props = {
  isLight: boolean;
  onToggle: () => void;
};

export default function ThemeToggle({ isLight, onToggle }: Props) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label="Toggle theme"
      title={isLight ? "Switch to Dark mode" : "Switch to Light mode"}
      className={actionButtonClass}
    >
      {isLight ? "Dark mode" : "Light mode"}
    </button>
  );
}

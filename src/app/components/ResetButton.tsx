// src/app/components/ResetButton.tsx
"use client";

import React from "react";
import { actionButtonClass } from "./HeaderActions";

type Props = { onClick: () => void };

export default function ResetButton({ onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Reset inputs to defaults"
      title="Reset inputs"
      className={actionButtonClass}
    >
      Reset
    </button>
  );
}

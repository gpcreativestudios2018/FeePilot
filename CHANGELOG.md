# Changelog
All notable changes to this project will be documented in this file.

This format is inspired by [Keep a Changelog](https://keepachangelog.com/) and uses semantic version tags.

## [v0.1.9] - 2025-10-30
### Added
- **Reverse calculator (/pro/target):**
  - “Solving for” pill shows whether you’re solving for **Profit** or **Margin**.
  - **Copy share link**: permalink to current reverse inputs via URL query params.
  - **Save & copy link**: auto-names a local preset and copies the share link.
  - Local **presets** (saved in `localStorage`) with Load/Delete.
  - **Dev: Clear presets** button visible in Preview when `NEXT_PUBLIC_DEV_TOOLS=true` or with `?devtools=1` on non-prod hosts.
- Fees now include **Discount (%)** and **Shipping charged to buyer ($)** in the fee base for more accurate platform rules.

### Fixed/Improved
- Minor UI polish in reverse flow and toast messages.

## [v0.1.8] - 2025-10-30
### Added
- Initial pass at **reverse links** and minor Pro UX improvements.

## [v0.1.6] - 2025-10-XX
### Added
- **Main calculator** with 8 summary cards, negative numbers in parentheses, decimal inputs, dark/light theme, persistence (localStorage), reset.
- **Share/Copy**: permalink to current inputs with “Permalink copied!” toast.
- **Comparison table** across platforms.
- **Export CSV** (client-side) for the comparison table (`src/lib/csv.ts`).
- **/pro** overview page and **reverse calculator v1.1** at `/pro/target`:
  - Solve for Target Profit ($) or Target Margin (%) (profit wins if both set).
  - Uses platform fee rules; includes Discount and Shipping charged to buyer in fee base.
  - Shows suggested price + breakdown (fees, total, profit, margin).

---

## Unreleased
- Fee overrides (per-platform custom rule overrides UI).
- Cloud presets (sync across devices).

[v0.1.9]: https://github.com/gpcreativestudios2018/FeePilot/releases/tag/v0.1.9
[v0.1.8]: https://github.com/gpcreativestudios2018/FeePilot/releases/tag/v0.1.8
[v0.1.6]: https://github.com/gpcreativestudios2018/FeePilot/releases/tag/v0.1.6

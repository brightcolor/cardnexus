"use client";

export function PrintControls({ printLabel, closeLabel }: { printLabel: string; closeLabel: string }) {
  return (
    <div className="no-print">
      <button type="button" onClick={() => window.print()} className="primary">{printLabel}</button>
      <button type="button" onClick={() => window.close()}>{closeLabel}</button>
    </div>
  );
}

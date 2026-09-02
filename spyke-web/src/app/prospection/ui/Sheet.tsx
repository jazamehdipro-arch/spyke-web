"use client";

import { useEffect } from "react";

/** Le panneau qui monte du bas, repris du prototype (.scrim / .sheet). */
export default function Sheet({
  ouvert,
  onClose,
  children,
}: {
  ouvert: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!ouvert) return;
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [ouvert, onClose]);

  return (
    <>
      <div className={"scrim" + (ouvert ? " on" : "")} onClick={onClose} />
      <div className={"sheet" + (ouvert ? " on" : "")}>
        <div className="grab" />
        <div className="sheet-in">{ouvert ? children : null}</div>
      </div>
    </>
  );
}

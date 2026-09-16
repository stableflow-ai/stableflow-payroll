import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { NOIR_ICON_URL } from "./config";

export function ZecWalletSelectModal(props: {
  visible: boolean;
  onClose: () => void;
  onSelectNoir: () => void;
}) {
  const { visible, onClose, onSelectNoir } = props;
  const [fadeIn, setFadeIn] = useState(false);
  const [render, setRender] = useState(false);

  useEffect(() => {
    if (visible) {
      setRender(true);
      setFadeIn(true);
      return;
    }
    setFadeIn(false);
    const timer = setTimeout(() => setRender(false), 200);
    return () => clearTimeout(timer);
  }, [visible]);

  useEffect(() => {
    const closeOnEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.body.addEventListener("keydown", closeOnEscapeKey);
    return () => document.body.removeEventListener("keydown", closeOnEscapeKey);
  }, [onClose]);

  const selectNoir = useCallback(() => {
    onSelectNoir();
    onClose();
  }, [onClose, onSelectNoir]);

  if (!render) return null;

  return createPortal(
    <div
      data-testid="zec-wallet-select-modal"
      className={`adapter-modal${fadeIn ? " adapter-modal-fade-in" : ""}`}
    >
      <div className="adapter-modal-wrapper">
        <div className="adapter-modal-header">
          <button type="button" onClick={onClose} className="close-button" tabIndex={0} />
          <div className="adapter-modal-title text-base">
            Connect a wallet on
            <br />
            Zcash to continue
          </div>
        </div>
        <div className="adapter-list">
          <button
            type="button"
            onClick={selectNoir}
            className="adapter-list-item flex items-center gap-2 text-base px-6 py-2 hover:bg-black/10 w-full"
          >
            <img src={NOIR_ICON_URL} alt="" className="adapter-list-item-icon" width={32} height={32} />
            <span className="adapter-list-item-name">Noir Wallet</span>
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

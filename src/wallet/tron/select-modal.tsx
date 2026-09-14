import { useWallet, type Wallet } from "@tronweb3/tronwallet-adapter-react-hooks";
import { WalletItem, WalletModalContext } from "@tronweb3/tronwallet-adapter-react-ui";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { visibleTronWallets } from "./utils";

function TronWalletSelectModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { wallets, select } = useWallet();
  const [fadeIn, setFadeIn] = useState(false);
  const [render, setRender] = useState(false);
  const walletsList = useMemo(() => visibleTronWallets(wallets), [wallets]);

  const onWalletClick = useCallback((wallet: Wallet) => {
    select(wallet.adapter.name);
    onClose();
  }, [onClose, select]);

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

  if (!render) return null;

  return createPortal(
    <div
      data-testid="wallet-select-modal"
      className={`adapter-modal${fadeIn ? " adapter-modal-fade-in" : ""}`}
    >
      <div className="adapter-modal-wrapper">
        <div className="adapter-modal-header">
          <button type="button" onClick={onClose} className="close-button" tabIndex={0} />
          <div className="adapter-modal-title">
            Connect a wallet on
            <br />
            Tron to continue
          </div>
        </div>
        <div className="adapter-list">
          {walletsList.map((wallet) => (
            <WalletItem
              key={wallet.adapter.name}
              wallet={wallet}
              onClick={() => onWalletClick(wallet)}
            />
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function TronWalletModalProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);

  return (
    <WalletModalContext.Provider value={{ visible, setVisible }}>
      {children}
      <TronWalletSelectModal visible={visible} onClose={() => setVisible(false)} />
    </WalletModalContext.Provider>
  );
}

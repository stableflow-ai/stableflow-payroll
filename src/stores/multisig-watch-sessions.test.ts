import { beforeEach, describe, expect, it } from "vitest";
import { useMultisigWatchStore } from "./multisig-watch-sessions";

const session = {
  id: "evm:1:0xabc",
  proposal: {
    chainKind: "evm" as const,
    safeTxHash: "0xabc",
    safeAddress: "0xsafe",
    chainId: 1,
  },
  quoteId: "q1",
  quoteBatchId: "b1",
  title: "Payroll_Batch Payment 1",
  type: "payroll",
  formKey: "form-1",
  listenDismissed: false,
};

describe("useMultisigWatchStore", () => {
  beforeEach(() => {
    useMultisigWatchStore.setState({ watches: [], executions: [] });
  });

  it("restores a watch after upsert and keeps it when listen is dismissed", () => {
    useMultisigWatchStore.getState().upsertWatch(session);
    expect(useMultisigWatchStore.getState().watches).toHaveLength(1);
    useMultisigWatchStore.getState().dismissListen(session.id);
    const live = useMultisigWatchStore.getState().watches[0];
    expect(live?.listenDismissed).toBe(true);
    expect(useMultisigWatchStore.getState().watches).toHaveLength(1);
  });

  it("removes a watch only when the host finishes", () => {
    useMultisigWatchStore.getState().upsertWatch(session);
    useMultisigWatchStore.getState().dismissListen(session.id);
    useMultisigWatchStore.getState().removeWatch(session.id);
    expect(useMultisigWatchStore.getState().watches).toEqual([]);
  });
});

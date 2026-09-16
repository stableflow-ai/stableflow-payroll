import type { NearConnector } from "@hot-labs/near-connect";

let connector: NearConnector | null = null;

export function setNearConnector(next: NearConnector | null) {
  connector = next;
}

export function getNearConnector(): NearConnector | null {
  return connector;
}

/**
 * Minimal Safe contract surface. Hand-written so the integration does not pull in
 * a Safe ABI package for four reads and two events.
 */

import { toEventSelector, type Hex } from "viem";

export const safeReadAbi = [
  {
    type: "function",
    name: "getThreshold",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "getOwners",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address[]" }],
  },
  {
    type: "function",
    name: "nonce",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "VERSION",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "string" }],
  },
] as const;

/**
 * Execution events in their **non-indexed** form.
 *
 * Safe changed the layout without changing the signature: 1.3.0 declares
 * `ExecutionSuccess(bytes32 txHash, uint256 payment)` while 1.4.1+ declares
 * `ExecutionSuccess(bytes32 indexed txHash, uint256 payment)`. Both therefore share
 * one topic0, so a single entry filters every version. The payload layout does
 * differ, which is why callers decode through `decodeSafeExecutionLog` instead of
 * trusting the decoded args.
 */
export const safeExecutionEventsAbi = [
  {
    type: "event",
    name: "ExecutionSuccess",
    inputs: [
      { name: "txHash", type: "bytes32", indexed: false },
      { name: "payment", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "ExecutionFailure",
    inputs: [
      { name: "txHash", type: "bytes32", indexed: false },
      { name: "payment", type: "uint256", indexed: false },
    ],
  },
] as const;

export const EXECUTION_SUCCESS_TOPIC: Hex = toEventSelector("ExecutionSuccess(bytes32,uint256)");
export const EXECUTION_FAILURE_TOPIC: Hex = toEventSelector("ExecutionFailure(bytes32,uint256)");

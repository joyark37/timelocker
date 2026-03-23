// OpenZeppelin TimelockController ABI
export const TIMELOCK_ABI = [
  {
    inputs: [{ name: 'id', type: 'bytes32' }],
    name: 'getOperation',
    outputs: [
      { name: 'id', type: 'bytes32' },
      { name: 'prevId', type: 'bytes32' },
      { name: 'target', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'data', type: 'bytes' },
      { name: 'eta', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'id', type: 'bytes32' }],
    name: 'getOperationState',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'id', type: 'bytes32' }],
    name: 'getTimestamp',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'id', type: 'bytes32' }],
    name: 'cancel',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'target', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'data', type: 'bytes' },
      { name: 'predecessor', type: 'bytes32' },
      { name: 'salt', type: 'bytes32' },
    ],
    name: 'getOperationId',
    outputs: [{ name: 'id', type: 'bytes32' }],
    stateMutability: 'pure',
    type: 'function',
  },
] as const

export const TIMELOCK_ADDRESS = '0x1a9C8182C09F50C8318d769245beA52c32BE35BC'

// Operation states
export enum OperationState {
  Unset = 0,
  Pending = 1,
  Ready = 2,
  Done = 3,
  Cancelled = 4,
}

export const OperationStateLabels: Record<OperationState, string> = {
  [OperationState.Unset]: 'Unset',
  [OperationState.Pending]: 'Pending',
  [OperationState.Ready]: 'Ready',
  [OperationState.Done]: 'Done',
  [OperationState.Cancelled]: 'Cancelled',
}

export const OperationStateColors: Record<OperationState, string> = {
  [OperationState.Unset]: 'text-gray-400',
  [OperationState.Pending]: 'text-amber-400 bg-amber-400/10',
  [OperationState.Ready]: 'text-emerald-400 bg-emerald-400/10',
  [OperationState.Done]: 'text-gray-400 bg-gray-400/10',
  [OperationState.Cancelled]: 'text-red-400 bg-red-400/10',
}

// OpenZeppelin TimelockController ABI
export const TIMELOCK_ABI = [
  // View functions
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
  // Cancel function
  {
    inputs: [{ name: 'id', type: 'bytes32' }],
    name: 'cancel',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // Role functions
  {
    inputs: [{ name: 'role', type: 'bytes32' }, { name: 'index', type: 'uint256' }],
    name: 'getRoleMember',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'role', type: 'bytes32' }],
    name: 'getRoleMemberCount',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  // Delay
  {
    inputs: [],
    name: 'getDelay',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  // Minimum delay
  {
    inputs: [],
    name: 'minimumDelay',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  // Maximum delay
  {
    inputs: [],
    name: 'maximumDelay',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  // Events for querying
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'id', type: 'bytes32' },
      { indexed: false, name: 'predecessor', type: 'bytes32' },
      { indexed: false, name: 'hash', type: 'bytes32' },
      { indexed: false, name: 'detail', type: 'tuple(bytes32 target, uint256 value, bytes data, bytes32 predecessor, bytes32 salt)' },
      { indexed: false, name: 'before', type: 'uint256' },
    ],
    name: 'CallScheduled',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'id', type: 'bytes32' },
      { indexed: false, name: 'hash', type: 'bytes32' },
    ],
    name: 'Cancelled',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'id', type: 'bytes32' },
    ],
    name: 'CallExecuted',
    type: 'event',
  },
] as const

export const TIMELOCK_ADDRESS = '0xD80f377DbF2ed081B9D240Be84BE2a8f80858f50'

// Base chain config
export const CHAIN_ID = 8453 // Base mainnet
export const RPC_URL = 'https://ancient-withered-night.base-mainnet.quiknode.pro/5d05469fe6066505ee390e5654fbe23916d8e912'

// Role hashes
export const ROLES = {
  PROPOSER: '0xb09aa5aeb3702cfd50a6a6c797e4cbaa5e4f8d7403fcc7b3528bde4b5ecc3f7f',
  EXECUTOR: '0xd8aa0f3194971a2a116cc797eb92bc52e2f805a6fcf9f4a67e4db1f8c6d0d81f',
  CANCELLER: '0x4b3948c9a69d82e358a45c8b3b1e26e620a4b50b3b683b1868d325c5b51f52b',
}

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

// Multicall3 address on Base
export const MULTICALL3_ADDRESS = '0xca11bde05977b3631167028862be2a173976ca11'

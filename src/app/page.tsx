'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { Address, formatEther } from 'viem'
import { createPublicClient, http } from 'viem'
import { base } from 'viem/chains'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { TIMELOCK_ABI, TIMELOCK_ADDRESS, ROLES, CHAIN_ID, RPC_URL, MULTICALL3_ADDRESS, OperationState, OperationStateLabels, OperationStateColors } from '@/lib/timelock'

interface Operation {
  id: string
  target: string
  value: bigint
  data: string
  eta: bigint
  prevId: string
}

interface ContractInfo {
  delay: bigint
  minDelay: bigint
  maxDelay: bigint
  proposers: string[]
  executors: string[]
  cancellers: string[]
}

const publicClient = createPublicClient({
  chain: { ...base, id: CHAIN_ID },
  transport: http(RPC_URL),
})

function formatDelay(seconds: bigint): string {
  const secs = Number(seconds)
  if (secs < 60) return `${secs} seconds`
  if (secs < 3600) return `${Math.floor(secs / 60)} minutes`
  if (secs < 86400) return `${Math.floor(secs / 3600)} hours`
  return `${Math.floor(secs / 86400)} days`
}

function truncateAddress(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

function ProposalCard({ 
  op, 
  state, 
  onCancel,
  cancelling 
}: { 
  op: Operation
  state: OperationState
  onCancel: () => void
  cancelling: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const isPending = state === OperationState.Pending

  const formatDate = (timestamp: bigint) => {
    if (timestamp === 0n) return 'N/A'
    const date = new Date(Number(timestamp) * 1000)
    return date.toLocaleString()
  }

  const getCountdown = (eta: bigint) => {
    if (eta === 0n) return ''
    const now = Math.floor(Date.now() / 1000)
    const diff = Number(eta) - now
    if (diff <= 0) return 'Ready!'
    const days = Math.floor(diff / 86400)
    const hours = Math.floor((diff % 86400) / 3600)
    const mins = Math.floor((diff % 3600) / 60)
    if (days > 0) return `${days}d ${hours}h`
    if (hours > 0) return `${hours}h ${mins}m`
    return `${mins}m`
  }

  const decodeData = (data: string) => {
    if (!data || data === '0x') return 'No data'
    if (data.length >= 10) {
      const selector = data.slice(0, 10)
      return `Function: ${selector} (${data.length - 10} bytes calldata)`
    }
    return data
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
      <div 
        className="p-4 cursor-pointer hover:bg-zinc-800/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm text-zinc-400">
              {truncateAddress(op.id)}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${OperationStateColors[state]}`}>
              {OperationStateLabels[state]}
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-zinc-400">
              ETA: {getCountdown(op.eta)}
            </span>
            <span className="text-emerald-400">
              {formatEther(op.value)} ETH
            </span>
            <span className="text-zinc-500">
              {expanded ? '▼' : '▶'}
            </span>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-zinc-800 mt-2 pt-3 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-zinc-500">Full ID:</span>
              <p className="font-mono text-xs text-zinc-300 break-all">{op.id}</p>
            </div>
            <div>
              <span className="text-zinc-500">Target:</span>
              <p className="font-mono text-xs text-zinc-300 break-all">{op.target}</p>
            </div>
            <div>
              <span className="text-zinc-500">Value:</span>
              <p className="text-zinc-300">{formatEther(op.value)} ETH</p>
            </div>
            <div>
              <span className="text-zinc-500">Execution Time:</span>
              <p className="text-zinc-300">{formatDate(op.eta)}</p>
            </div>
          </div>
          
          <div>
            <span className="text-zinc-500 text-sm">Calldata:</span>
            <p className="font-mono text-xs text-zinc-400 break-all bg-zinc-950 p-2 rounded mt-1">
              {decodeData(op.data)}
            </p>
          </div>

          {isPending && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onCancel()
              }}
              disabled={cancelling}
              className="w-full py-2 px-4 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {cancelling ? 'Cancelling...' : 'Cancel Operation'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function ContractInfoCard({ info }: { info: ContractInfo }) {
  const hasDelayInfo = info.delay > 0n
  
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <span>📋</span> Contract Information
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div>
            <span className="text-zinc-500 text-sm">Contract Address</span>
            <p className="font-mono text-xs text-zinc-300 break-all">{TIMELOCK_ADDRESS}</p>
          </div>
          <div>
            <span className="text-zinc-500 text-sm">Network</span>
            <p className="text-zinc-300">Base Mainnet</p>
          </div>
          {hasDelayInfo && (
            <>
              <div>
                <span className="text-zinc-500 text-sm">Current Delay</span>
                <p className="text-zinc-300">{formatDelay(info.delay)}</p>
              </div>
              <div>
                <span className="text-zinc-500 text-sm">Delay Range</span>
                <p className="text-zinc-300">{formatDelay(info.minDelay)} - {formatDelay(info.maxDelay)}</p>
              </div>
            </>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <span className="text-zinc-500 text-sm">Proposers ({info.proposers.length})</span>
            <div className="mt-1 space-y-1">
              {info.proposers.length > 0 ? (
                info.proposers.slice(0, 3).map((addr, i) => (
                  <p key={i} className="font-mono text-xs text-zinc-400">{truncateAddress(addr)}</p>
                ))
              ) : (
                <p className="text-xs text-zinc-500">None found</p>
              )}
              {info.proposers.length > 3 && (
                <p className="text-xs text-zinc-500">+{info.proposers.length - 3} more</p>
              )}
            </div>
          </div>
          <div>
            <span className="text-zinc-500 text-sm">Executors ({info.executors.length})</span>
            <div className="mt-1 space-y-1">
              {info.executors.length > 0 ? (
                info.executors.slice(0, 3).map((addr, i) => (
                  <p key={i} className="font-mono text-xs text-zinc-400">{truncateAddress(addr)}</p>
                ))
              ) : (
                <p className="text-xs text-zinc-500">None found</p>
              )}
              {info.executors.length > 3 && (
                <p className="text-xs text-zinc-500">+{info.executors.length - 3} more</p>
              )}
            </div>
          </div>
          <div>
            <span className="text-zinc-500 text-sm">Cancellers ({info.cancellers.length})</span>
            <div className="mt-1 space-y-1">
              {info.cancellers.length > 0 ? (
                info.cancellers.slice(0, 3).map((addr, i) => (
                  <p key={i} className="font-mono text-xs text-zinc-400">{truncateAddress(addr)}</p>
                ))
              ) : (
                <p className="text-xs text-zinc-500">None found</p>
              )}
              {info.cancellers.length > 3 && (
                <p className="text-xs text-zinc-500">+{info.cancellers.length - 3} more</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatsCard({ stats }: { 
  stats: { scheduled: number; executed: number; cancelled: number; pending: number }
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <span>📊</span> Operation Statistics
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-3 bg-zinc-800/50 rounded-lg">
          <p className="text-2xl font-bold text-amber-400">{stats.pending}</p>
          <p className="text-xs text-zinc-500">Pending</p>
        </div>
        <div className="text-center p-3 bg-zinc-800/50 rounded-lg">
          <p className="text-2xl font-bold text-emerald-400">{stats.executed}</p>
          <p className="text-xs text-zinc-500">Executed</p>
        </div>
        <div className="text-center p-3 bg-zinc-800/50 rounded-lg">
          <p className="text-2xl font-bold text-red-400">{stats.cancelled}</p>
          <p className="text-xs text-zinc-500">Cancelled</p>
        </div>
        <div className="text-center p-3 bg-zinc-800/50 rounded-lg">
          <p className="text-2xl font-bold text-zinc-400">{stats.scheduled}</p>
          <p className="text-xs text-zinc-500">Total Scheduled</p>
        </div>
      </div>
    </div>
  )
}

// Multicall3 contract ABI
const MULTICALL3_ABI = [
  {
    inputs: [{
      name: 'calls',
      type: 'tuple[]',
      components: [
        { name: 'target', type: 'address' },
        { name: 'callData', type: 'bytes' },
      ]
    }],
    name: 'aggregate3',
    outputs: [{
      name: 'returnData',
      type: 'tuple[]',
      components: [
        { name: 'success', type: 'bool' },
        { name: 'returnData', type: 'bytes' },
      ]
    }],
    stateMutability: 'payable',
    type: 'function',
  },
] as const

// Event ABIs for getLogs
const CALL_SCHEDULED_ABI = {
  type: 'event',
  name: 'CallScheduled',
  inputs: [
    { indexed: true, name: 'id', type: 'bytes32' },
    { indexed: false, name: 'predecessor', type: 'bytes32' },
    { indexed: false, name: 'hash', type: 'bytes32' },
    { indexed: false, name: 'detail', type: 'tuple(bytes32 target, uint256 value, bytes data, bytes32 predecessor, bytes32 salt)' },
    { indexed: false, name: 'before', type: 'uint256' },
  ],
} as const

const CANCELLED_ABI = {
  type: 'event',
  name: 'Cancelled',
  inputs: [
    { indexed: true, name: 'id', type: 'bytes32' },
    { indexed: false, name: 'hash', type: 'bytes32' },
  ],
} as const

const CALL_EXECUTED_ABI = {
  type: 'event',
  name: 'CallExecuted',
  inputs: [
    { indexed: true, name: 'id', type: 'bytes32' },
    { indexed: false, name: 'hash', type: 'bytes32' },
  ],
} as const

async function getLogsInBatches(
  client: typeof publicClient,
  eventAbi: any,
  fromBlock: bigint,
  toBlock: bigint,
  batchSize: bigint = 1000n
): Promise<any[]> {
  const allLogs: any[] = []
  
  for (let start = fromBlock; start < toBlock; start += batchSize) {
    const end = start + batchSize > toBlock ? toBlock : start + batchSize
    
    try {
      const logs = await client.getLogs({
        address: TIMELOCK_ADDRESS,
        event: eventAbi,
        fromBlock: start,
        toBlock: end,
      })
      allLogs.push(...logs)
    } catch (e) {
      console.warn(`Failed to fetch logs from ${start} to ${end}:`, e)
    }
  }
  
  return allLogs
}

// Use batched contract reads via Promise.all
async function getContractInfoMulticall(): Promise<ContractInfo> {
  const proposerRole = ROLES.PROPOSER as `0x${string}`
  const executorRole = ROLES.EXECUTOR as `0x${string}`
  const cancellerRole = ROLES.CANCELLER as `0x${string}`

  let proposerCount = 0n
  let executorCount = 0n
  let cancellerCount = 0n
  let delay = 0n
  let minDelay = 0n
  let maxDelay = 0n

  try {
    // Batch all calls together
    const [pc, ec, cc, d, md, xd] = await Promise.all([
      publicClient.readContract({ address: TIMELOCK_ADDRESS, abi: TIMELOCK_ABI, functionName: 'getRoleMemberCount', args: [proposerRole] }).catch(() => 0n),
      publicClient.readContract({ address: TIMELOCK_ADDRESS, abi: TIMELOCK_ABI, functionName: 'getRoleMemberCount', args: [executorRole] }).catch(() => 0n),
      publicClient.readContract({ address: TIMELOCK_ADDRESS, abi: TIMELOCK_ABI, functionName: 'getRoleMemberCount', args: [cancellerRole] }).catch(() => 0n),
      publicClient.readContract({ address: TIMELOCK_ADDRESS, abi: TIMELOCK_ABI, functionName: 'getDelay' }).catch(() => 0n),
      publicClient.readContract({ address: TIMELOCK_ADDRESS, abi: TIMELOCK_ABI, functionName: 'minimumDelay' }).catch(() => 0n),
      publicClient.readContract({ address: TIMELOCK_ADDRESS, abi: TIMELOCK_ABI, functionName: 'maximumDelay' }).catch(() => 0n),
    ])
    proposerCount = pc as bigint
    executorCount = ec as bigint
    cancellerCount = cc as bigint
    delay = d as bigint
    minDelay = md as bigint
    maxDelay = xd as bigint
  } catch (e) {
    console.warn('Failed to get contract info:', e)
  }

  const proposers: string[] = []
  const executors: string[] = []
  const cancellers: string[] = []

  // Get proposers (limit to first 10 to avoid too many calls)
  for (let i = 0n; i < proposerCount && i < 10n; i++) {
    try {
      const addr = await publicClient.readContract({ address: TIMELOCK_ADDRESS, abi: TIMELOCK_ABI, functionName: 'getRoleMember', args: [proposerRole, i] })
      proposers.push(addr as string)
    } catch {}
  }

  // Get executors (limit to first 10)
  for (let i = 0n; i < executorCount && i < 10n; i++) {
    try {
      const addr = await publicClient.readContract({ address: TIMELOCK_ADDRESS, abi: TIMELOCK_ABI, functionName: 'getRoleMember', args: [executorRole, i] })
      executors.push(addr as string)
    } catch {}
  }

  // Get cancellers (limit to first 10)
  for (let i = 0n; i < cancellerCount && i < 10n; i++) {
    try {
      const addr = await publicClient.readContract({ address: TIMELOCK_ADDRESS, abi: TIMELOCK_ABI, functionName: 'getRoleMember', args: [cancellerRole, i] })
      cancellers.push(addr as string)
    } catch {}
  }

  return { delay, minDelay, maxDelay, proposers, executors, cancellers }
}

export default function Home() {
  const { isConnected } = useAccount()
  const [cancelId, setCancelId] = useState<string | null>(null)
  const [proposals, setProposals] = useState<{op: Operation; state: OperationState}[]>([])
  const [contractInfo, setContractInfo] = useState<ContractInfo>({ delay: 0n, minDelay: 0n, maxDelay: 0n, proposers: [], executors: [], cancellers: [] })
  const [stats, setStats] = useState({ scheduled: 0, executed: 0, cancelled: 0, pending: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastFetch, setLastFetch] = useState<number>(0)

  // Rate limiting: only fetch once on mount (no auto-refresh to save RPC calls)
  useEffect(() => {
    // Prevent rapid consecutive calls
    const now = Date.now()
    if (now - lastFetch < 10000) { // 10 second cooldown
      setLoading(false)
      return
    }
    setLastFetch(now)

    let mounted = true

    async function fetchData() {
      if (!mounted) return
      
      try {
        setError(null)
        
        // Get contract info (only once)
        if (contractInfo.proposers.length === 0 && contractInfo.executors.length === 0) {
          try {
            const info = await getContractInfoMulticall()
            if (mounted) setContractInfo(info)
          } catch (e) {
            console.warn('Failed to get contract info:', e)
          }
        }
        
        // Get current block and query recent 20 blocks (~4 minutes on Base)
        // This needs only 4 requests with QuickNode's 5-block limit
        const currentBlock = await publicClient.getBlock()
        const fromBlock = currentBlock.number - 20n // Last ~4 minutes
        const toBlock = currentBlock.number
        const BATCH_SIZE = 5n
        
        console.log(`Fetching blocks ${fromBlock} to ${toBlock} (~4 min range)`)
        
        // Fetch events in batches (QuickNode limit is 5 blocks per request)
        const [scheduledLogs, cancelledLogs, executedLogs] = await Promise.all([
          getLogsInBatches(publicClient, CALL_SCHEDULED_ABI, fromBlock, toBlock, BATCH_SIZE),
          getLogsInBatches(publicClient, CANCELLED_ABI, fromBlock, toBlock, BATCH_SIZE),
          getLogsInBatches(publicClient, CALL_EXECUTED_ABI, fromBlock, toBlock, BATCH_SIZE),
        ])

        // Set stats
        setStats({
          scheduled: scheduledLogs.length,
          executed: executedLogs.length,
          cancelled: cancelledLogs.length,
          pending: 0,
        })

        // Build sets
        const cancelledIds = new Set(cancelledLogs.map(e => e.args.id))
        const executedIds = new Set(executedLogs.map(e => e.args.id))

        // Filter to pending operations
        const pendingIds = scheduledLogs
          .filter(e => !cancelledIds.has(e.args.id) && !executedIds.has(e.args.id))
          .map(e => e.args.id as string)

        // Get operation details for pending operations
        const results = await Promise.all(
          pendingIds.slice(-20).map(async (id) => {
            try {
              const [op, state] = await Promise.all([
                publicClient.readContract({
                  address: TIMELOCK_ADDRESS,
                  abi: TIMELOCK_ABI,
                  functionName: 'getOperation',
                  args: [id as Address],
                }),
                publicClient.readContract({
                  address: TIMELOCK_ADDRESS,
                  abi: TIMELOCK_ABI,
                  functionName: 'getOperationState',
                  args: [id as Address],
                }),
              ])

              if (state === OperationState.Pending || state === OperationState.Ready) {
                return {
                  op: {
                    id,
                    target: op[2] as string,
                    value: op[3] as bigint,
                    data: op[4] as string,
                    eta: op[5] as bigint,
                    prevId: op[1] as string,
                  },
                  state: state as OperationState,
                }
              }
              return null
            } catch (e) {
              return null
            }
          })
        )

        const validResults = results.filter(Boolean) as {op: Operation; state: OperationState}[]
        validResults.sort((a, b) => Number(a.op.eta - b.op.eta))
        
        if (mounted) {
          setProposals(validResults)
          setStats(s => ({ ...s, pending: validResults.length }))
        }
      } catch (err) {
        console.error('Failed to fetch data:', err)
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch data')
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    fetchData()
    
    return () => {
      mounted = false
    }
  }, []) // Empty dependency array = only run once on mount

  const { data: cancelData, writeContract: cancelWrite } = useWriteContract()
  const { isLoading: isCanceling } = useWaitForTransactionReceipt({ 
    hash: cancelData 
  })

  const handleCancel = (id: string) => {
    setCancelId(id)
    cancelWrite({
      address: TIMELOCK_ADDRESS,
      abi: TIMELOCK_ABI,
      functionName: 'cancel',
      args: [id as Address],
    })
  }

  const pendingProposals = proposals.filter(p => 
    p.state === OperationState.Pending || p.state === OperationState.Ready
  )

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <span className="text-2xl">🏛️</span>
            Timelock Dashboard
          </h1>
          <ConnectButton />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Contract Info */}
        <ContractInfoCard info={contractInfo} />

        {/* Stats */}
        <StatsCard stats={stats} />

        {/* Pending Proposals */}
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span>📝</span> Pending Proposals (Last ~4 Minutes)
          </h2>
          
          {loading ? (
            <div className="text-center py-16 text-zinc-500">
              <p className="text-4xl mb-4">⏳</p>
              <p>Loading...</p>
            </div>
          ) : error ? (
            <div className="text-center py-16 text-red-400">
              <p className="text-4xl mb-4">⚠️</p>
              <p>Error: {error}</p>
            </div>
          ) : pendingProposals.length === 0 ? (
            <div className="text-center py-12 bg-zinc-900/50 rounded-lg border border-zinc-800">
              <p className="text-4xl mb-4">✅</p>
              <p className="text-zinc-400 font-medium">No recent pending proposals</p>
              <p className="text-zinc-500 text-sm mt-2">
                No pending proposals in the last ~4 minutes. Try refreshing or check if the proposal was just submitted.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingProposals.map(({ op, state }) => (
                <ProposalCard
                  key={op.id}
                  op={op}
                  state={state}
                  onCancel={() => handleCancel(op.id)}
                  cancelling={cancelId === op.id && isCanceling}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-zinc-600 text-sm pt-8">
          <p>Network: <span className="font-medium">Base Mainnet</span></p>
          <p>Monitoring: <span className="font-mono">{TIMELOCK_ADDRESS}</span></p>
        </div>
      </main>
    </div>
  )
}

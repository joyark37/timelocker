'use client'

import { useState, useEffect } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { Address, formatEther } from 'viem'
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { TIMELOCK_ABI, TIMELOCK_ADDRESS, OperationState, OperationStateLabels, OperationStateColors } from '@/lib/timelock'

interface Operation {
  id: string
  target: string
  value: bigint
  data: string
  eta: bigint
  prevId: string
}

const publicClient = createPublicClient({
  chain: mainnet,
  transport: http('https://go.getblock.us/35be685f5db54d64a8b42a908ee504d0'),
})

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
  const isReady = state === OperationState.Ready

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

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
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

export default function Home() {
  const { isConnected } = useAccount()
  const [cancelId, setCancelId] = useState<string | null>(null)
  const [proposals, setProposals] = useState<{op: Operation; state: OperationState}[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    async function fetchProposals() {
      if (!mounted) return
      
      try {
        setError(null)
        
        // Use a fixed recent block range (getBlockNumber seems to fail on GetBlock)
        const LATEST_BLOCK = 21500000n  // Recent Ethereum block
        const fromBlock = LATEST_BLOCK - 1500n
        const toBlock = LATEST_BLOCK
        
        console.log('Fetching blocks:', fromBlock, 'to', toBlock)
        
        // Fetch events in batches
        const [scheduledLogs, cancelledLogs, executedLogs] = await Promise.all([
          getLogsInBatches(publicClient, CALL_SCHEDULED_ABI, fromBlock, toBlock),
          getLogsInBatches(publicClient, CANCELLED_ABI, fromBlock, toBlock),
          getLogsInBatches(publicClient, CALL_EXECUTED_ABI, fromBlock, toBlock),
        ])

        console.log('Events:', scheduledLogs.length, 'scheduled,', cancelledLogs.length, 'cancelled,', executedLogs.length, 'executed')

        // Build sets
        const cancelledIds = new Set(cancelledLogs.map(e => e.args.id))
        const executedIds = new Set(executedLogs.map(e => e.args.id))

        // Filter to pending operations
        const pendingIds = scheduledLogs
          .filter(e => !cancelledIds.has(e.args.id) && !executedIds.has(e.args.id))
          .map(e => e.args.id as string)

        console.log('Pending IDs:', pendingIds)

        // Get operation details
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
              console.warn('Failed to get operation:', id, e)
              return null
            }
          })
        )

        const validResults = results.filter(Boolean) as {op: Operation; state: OperationState}[]
        validResults.sort((a, b) => Number(a.op.eta - b.op.eta))
        
        if (mounted) {
          setProposals(validResults)
        }
      } catch (err) {
        console.error('Failed to fetch proposals:', err)
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch proposals')
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    fetchProposals()
    const interval = setInterval(fetchProposals, 30000)
    
    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

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

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Pending Proposals</h2>
          <p className="text-zinc-500 text-sm">
            Monitoring: <span className="font-mono text-zinc-400">{TIMELOCK_ADDRESS}</span>
          </p>
        </div>

        {loading ? (
          <div className="text-center py-16 text-zinc-500">
            <p className="text-4xl mb-4">⏳</p>
            <p>Loading proposals...</p>
          </div>
        ) : error ? (
          <div className="text-center py-16 text-red-400">
            <p className="text-4xl mb-4">⚠️</p>
            <p>Error: {error}</p>
          </div>
        ) : pendingProposals.length === 0 ? (
          <div className="text-center py-16 text-zinc-500">
            <p className="text-4xl mb-4">📭</p>
            <p>No pending proposals in recent blocks</p>
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

        {proposals.length > 0 && (
          <div className="mt-8">
            <h3 className="text-sm font-medium text-zinc-500 mb-3">All Operations</h3>
            <div className="space-y-2">
              {proposals.map(({ op, state }) => (
                <div key={op.id} className="flex items-center justify-between text-sm bg-zinc-900/50 p-2 rounded">
                  <span className="font-mono text-zinc-400 text-xs">{op.id}</span>
                  <span className={`px-2 py-0.5 rounded text-xs ${OperationStateColors[state]}`}>
                    {OperationStateLabels[state]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

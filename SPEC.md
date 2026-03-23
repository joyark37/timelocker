# Timelock Dashboard Specification

## Project Overview
- **Name**: Timelock Proposal Dashboard
- **Type**: Next.js WebApp
- **Core Functionality**: Monitor and manage OpenZeppelin TimelockController pending proposals
- **Target Users**: Governance operators, multisig owners

## Technical Stack
- Next.js 14 (App Router)
- wagmi + viem (chain interaction)
- RainbowKit (wallet connection)
- TypeScript
- Tailwind CSS

## Chain & Contract
- **Network**: Ethereum Mainnet (chainId: 1)
- **Timelock Address**: 0x1a9C8182C09F50C8318d769245beA52c32BE35BC
- **Contract**: OpenZeppelin TimelockController

## UI/UX Specification

### Layout
- Header with RainbowKit Connect button
- Main content area with proposal cards
- Dark theme (governance aesthetic)

### Color Palette
- Background: #0f0f0f (dark)
- Card: #1a1a1a
- Primary: #6366f1 (indigo)
- Pending: #f59e0b (amber)
- Ready: #10b981 (emerald)
- Done: #6b7280 (gray)
- Cancelled: #ef4444 (red)

### Components

#### 1. Header
- App title: "Timelock Dashboard"
- Wallet connect button (RainbowKit)

#### 2. Pending Proposals List
- Card-based layout
- Each card shows:
  - Proposal ID (truncated hash)
  - Target address
  - Value (in ETH)
  - ETA (formatted datetime)
  - Status badge
  - Detail toggle

#### 3. Proposal Detail Modal/Section
- Full ID
- Target address (copyable)
- Value
- Data (hex, truncated)
- Function selector (if decoded)
- ETA countdown
- Cancel button (if connected)

#### 4. Status Badges
- Pending (amber)
- Ready (emerald)
- Done (gray)
- Cancelled (red)

## Functionality Specification

### Core Features

1. **Query Pending Operations**
   - Use `viem.readContract` to call TimelockController
   - Poll every 30 seconds for updates
   - Fetch: id, target, value, data, predecessor, salt, eta

2. **Get Operation State**
   - Call `getOperationState(bytes32 id)`
   - States: 0=Unset, 1=Pending, 2=Ready, 3=Done, 4=Cancelled

3. **Display Proposal Details**
   - Show decoded info where possible
   - Format timestamps
   - Format ETH values

4. **Cancel Operation** (when connected)
   - Call `cancel(bytes32 id)`
   - Requires connected wallet with executor role

### ABI (TimelockController)
```solidity
function getOperationId(address target, uint256 value, bytes data, bytes32 predecessor, bytes32 salt) returns (bytes32)
function getOperation(bytes32 id) returns (struct TimelockController.Operation)
function getOperationState(bytes32 id) returns (uint8)
function getTimestamp(bytes32 id) returns (uint256)
function cancel(bytes32 id)
```

### Edge Cases
- No pending proposals: Show empty state
- Contract read error: Show error message with retry
- Wallet not connected: Show connect prompt for cancel action

## Acceptance Criteria
- [ ] Page loads and connects to ETH mainnet
- [ ] Pending proposals displayed correctly
- [ ] Status badges show correct colors
- [ ] Detail view shows all operation data
- [ ] Cancel button works (with connected wallet)
- [ ] Auto-refresh every 30 seconds
- [ ] Responsive on mobile

## Deployment
- Vercel (automatic from GitHub)

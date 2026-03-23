import { http, createConfig } from 'wagmi'
import { mainnet } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'

export const config = createConfig({
  chains: [mainnet],
  transports: {
    [mainnet.id]: http('https://go.getblock.us/35be685f5db54d64a8b42a908ee504d0'),
  },
  connectors: [
    injected(),
  ],
})

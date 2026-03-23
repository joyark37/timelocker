import { http, createConfig } from 'wagmi'
import { base } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'

export const config = createConfig({
  chains: [base],
  transports: {
    [base.id]: http('https://ancient-withered-night.base-mainnet.quiknode.pro/5d05469fe6066505ee390e5654fbe23916d8e912'),
  },
  connectors: [
    injected(),
  ],
})

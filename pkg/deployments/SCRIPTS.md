##Useful scripts

1. [Update authorizer](../vault/scripts/baobab/updateAuthorizer.ts) used to initialize vault with authorizer
2. [Relayer approvals](../vault/scripts/baobab/relayerApprovals.ts) used configure relayer (approvals)
3. [Mint test tokens](../solidity-utils/scripts/baobab/mintTestTokens.ts) used to mint test tokens
4. [Configure Asset manager](../pool-weighted/scripts/baobab/configAM.ts) set investment config for AM
5. [Initialize pool](../asset-manager-utils/scripts/baobab/initPool.ts) initialize pool by adding tokens
6. [Initialize Asset manager](../asset-manager-utils/scripts/baobab/intiAM.ts) set poolId for new AM
7. [Asset manager simple tests](../asset-manager-utils/scripts/baobab/tests.ts) simple test (rebalance)

To run script:

```
cd /pkg/asset-manager-utils
```

```
hardhat run scripts/baobab/tests.ts --network baobab
```

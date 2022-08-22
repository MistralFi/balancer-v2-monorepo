# <img src="../../logo.svg" alt="Balancer" height="128px">

# Balancer V2 Deployments

[![NPM Package](https://img.shields.io/npm/v/@balancer-labs/v2-deployments.svg)](https://www.npmjs.org/package/@balancer-labs/v2-deployments)
[![GitHub Repository](https://img.shields.io/badge/github-deployments-lightgrey?logo=github)](https://github.com/balancer-labs/balancer-v2-monorepo/tree/deployments-latest/pkg/deployments)

This package contains the addresses and ABIs of all Balancer V2 deployed contracts, for Ethereum, Polygon, Arbitrum and Optimism mainnet, as well as various test networks. Each deployment consists of a deployment script (called 'task'), inputs (script configuration, such as dependencies), outputs (typically contract addresses), and ABIs of related contracts.

Addresses and ABIs can be consumed from the package in JavaScript environments, or manually retrieved from the [GitHub](https://github.com/balancer-labs/balancer-v2-monorepo/tree/master/pkg/deployments) repository.

Note that some protocol contracts are created dynamically: for example, `WeightedPool` contracts are deployed by the canonical `WeightedPoolFactory`. While the ABIs of these contracts are stored in the `abi` directory of each deployment, their addresses are not. Those can be retrieved by querying the on-chain state or processing emitted events.

## Overview

### Deploying Contracts

For more information on how to create new deployments or run existing ones in new networks, head to the [deployment guide](DEPLOYING.md).

### Installation

```console
$ npm install @balancer-labs/v2-deployments
```

### Usage

Import `@balancer-labs/v2-deployments` to access the different ABIs and deployed addresses. To see all Task IDs and their associated contracts, head to [Past Deployments](#past-deployments).

---

- **async function getBalancerContract(taskID, contract, network)**

Returns an [Ethers](https://docs.ethers.io/v5/) contract object for a canonical deployment (e.g. the Vault, or a Pool factory).

_Note: requires using [Hardhat](https://hardhat.org/) with the [`hardhat-ethers`](https://hardhat.org/plugins/nomiclabs-hardhat-ethers.html) plugin._

- **async function getBalancerContractAt(taskID, contract, address)**

Returns an [Ethers](https://docs.ethers.io/v5/) contract object for a contract dynamically created at a known address (e.g. a Pool created from a factory).

_Note: requires using [Hardhat](https://hardhat.org/) with the [`hardhat-ethers`](https://hardhat.org/plugins/nomiclabs-hardhat-ethers.html) plugin._

- **async function getBalancerContractAbi(taskID, contract)**

Returns a contract's [ABI](https://docs.soliditylang.org/en/latest/abi-spec.html).

- **async function getBalancerContractBytecode(taskID, contract)**

Returns a contract's [creation code](https://docs.soliditylang.org/en/latest/contracts.html#creating-contracts).

- **async function getBalancerContractAddress(taskID, contract, network)**

Returns the address of a contract's canonical deployment.

- **async function getBalancerDeployment(taskID, network)**

Returns an object with all contracts from a deployment and their addresses.

## Active Deployments (todo: update)

| Description                                          | Task ID                                                                                              |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Authorizer, governance contract                      | [`20210418-authorizer`](./tasks/20210418-authorizer)                                                 |

## Scripts (todo: update)

These are deployments for script-like contracts (often called 'coordinators') which are typically granted some permission by Governance and then executed, after which they become useless.

| Description                                         | Task ID                                                                                                    |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Coordination of the veBAL deployment                | [`20220325-veBAL-deployment-coordinator`](./tasks/scripts/20220325-veBAL-deployment-coordinator)           |

## Deprecated Deployments

These deployments have been deprecated because they're either outdated and have been replaced by newer versions, or because they no longer form part of the current infrastructure. **In almost all cases they should no longer be used,** and are only kept here for historical reasons.

Go to each deprecated deployment's readme file to learn more about why it is deprecated, and what the replacement deployment is (if any).

| Description                                      | Task ID                                                                                             |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------- |

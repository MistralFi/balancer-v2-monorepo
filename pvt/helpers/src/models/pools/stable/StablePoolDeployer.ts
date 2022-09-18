import { Contract } from 'ethers';
import { deploy } from '@balancer-labs/v2-helpers/src/contract';

import { RawStablePoolDeployment, StablePoolDeployment, StablePoolType } from './types';

import Vault from '../../vault/Vault';
import VaultDeployer from '../../vault/VaultDeployer';
import TypesConverter from '../../types/TypesConverter';
import StablePool from './StablePool';

const NAME = 'Balancer Pool Token';
const SYMBOL = 'BPT';

export default {
  async deploy(params: RawStablePoolDeployment): Promise<StablePool> {
    const deployment = TypesConverter.toStablePoolDeployment(params);
    const vaultParams = { ...TypesConverter.toRawVaultDeployment(params), mocked: params.mockedVault ?? false };
    const vault = params?.vault ?? (await VaultDeployer.deploy(vaultParams));
    const relayer = await deploy('v2-asset-manager-utils/Relayer', { args: [vault.address] });
    const pool = await this._deployStandalone(deployment, vault, relayer);

    const poolId = await pool.getPoolId();
    const bptIndex = await pool.getBptIndex();
    const { tokens, swapFeePercentage, amplificationParameter, owner, assetManagers } = deployment;

    return new StablePool(
      pool,
      poolId,
      vault,
      tokens,
      bptIndex,
      swapFeePercentage,
      amplificationParameter,
      relayer,
      assetManagers,
      owner
    );
  },

  _deployStandalone: async function (params: StablePoolDeployment, vault: Vault, relayer: Contract): Promise<Contract> {
    const {
      tokens,
      rateProviders,
      assetManagers,
      tokenRateCacheDurations,
      exemptFromYieldProtocolFeeFlags,
      swapFeePercentage,
      pauseWindowDuration,
      bufferPeriodDuration,
      amplificationParameter,
      from,
      poolType,
      delegateOwner,
    } = params;

    const owner = TypesConverter.toAddress(params.owner);
    let result: Promise<Contract>;
    switch (poolType) {
      case StablePoolType.RELAYED_STABLE_POOL: {
        let own = owner;
        if (delegateOwner) {
          own = delegateOwner;
        }
        result = deploy('v2-pool-stable/RelayedComposableStablePool', {
          args: [
            {
              vault: vault.address,
              protocolFeeProvider: vault.getFeesProvider().address,
              name: NAME,
              symbol: SYMBOL,
              tokens: tokens.addresses,
              rateProviders: TypesConverter.toAddresses(rateProviders),
              tokenRateCacheDurations,
              exemptFromYieldProtocolFeeFlags,
              amplificationParameter,
              swapFeePercentage,
              pauseWindowDuration,
              bufferPeriodDuration,
              owner: own,
              assetManagers,
            },
            relayer.address,
          ],
          from,
        });
        break;
      }
      default: {
        result = deploy('v2-pool-stable/MockComposableStablePool', {
          args: [
            {
              vault: vault.address,
              protocolFeeProvider: vault.getFeesProvider().address,
              name: NAME,
              symbol: SYMBOL,
              tokens: tokens.addresses,
              rateProviders: TypesConverter.toAddresses(rateProviders),
              tokenRateCacheDurations,
              exemptFromYieldProtocolFeeFlags,
              amplificationParameter,
              swapFeePercentage,
              pauseWindowDuration,
              bufferPeriodDuration,
              owner,
              assetManagers,
            },
          ],
          from,
        });
      }
    }
    return result;
  },
};

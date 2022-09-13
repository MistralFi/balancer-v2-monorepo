import { expect } from 'chai';
import { BigNumberish, bn, fp } from '@balancer-labs/v2-helpers/src/numbers';

import TokenList from '@balancer-labs/v2-helpers/src/models/tokens/TokenList';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ethers } from 'hardhat';
import { actionId } from '@balancer-labs/v2-helpers/src/models/misc/actions';
import { ANY_ADDRESS } from '@balancer-labs/v2-helpers/src/constants';
import StablePool from '@balancer-labs/v2-helpers/src/models/pools/stable/StablePool';
import { RawStablePoolDeployment, StablePoolType } from '@balancer-labs/v2-helpers/src/models/pools/stable/types';
import { deploy } from '@balancer-labs/v2-helpers/src/contract';
import { MONTH } from '@balancer-labs/v2-helpers/src/time';
import { Contract } from 'ethers';

describe('RelayedComposableStablePool tests', function () {
  let allTokens: TokenList;
  let relayedWeightedPool: StablePool;
  let tokens: TokenList;
  let deployer: SignerWithAddress;
  let user: SignerWithAddress;
  let recipient: SignerWithAddress;
  const MAX_TOKENS = 20;
  const NUM_TOKENS = 2;
  let initialBalances: BigNumberish[];
  before('setup signers', async () => {
    [deployer, user] = await ethers.getSigners();
  });

  async function deployPool(
    tokens: TokenList,
    params: RawStablePoolDeployment = {},
    rates: BigNumberish[] = [],
    durations: number[] = []
  ): Promise<StablePool> {
    const rateProviders: Contract[] = [];
    const tokenRateCacheDurations: number[] = [];
    const exemptFromYieldProtocolFeeFlags: boolean[] = [];

    for (let i = 0; i < tokens.length; i++) {
      rateProviders[i] = await deploy('v2-pool-utils/MockRateProvider');
      await rateProviders[i].mockRate(rates[i] || fp(1));
      tokenRateCacheDurations[i] = MONTH + i;
      exemptFromYieldProtocolFeeFlags[i] = i % 2 == 0; // set true for even tokens
    }

    return await StablePool.create({
      tokens,
      rateProviders,
      tokenRateCacheDurations: durations.length > 0 ? durations : tokenRateCacheDurations,
      exemptFromYieldProtocolFeeFlags,
      owner: deployer,
      admin: deployer,
      poolType: StablePoolType.RELAYED_STABLE_POOL,
      ...params,
    });
  }

  sharedBeforeEach('deploy tokens', async () => {
    allTokens = await TokenList.create(MAX_TOKENS, { sorted: true, varyDecimals: true });
    tokens = allTokens.subset(NUM_TOKENS);
    await allTokens.mint({ to: deployer, amount: fp(100) });
    await allTokens.mint({ to: user, amount: fp(100) });
    relayedWeightedPool = await deployPool(tokens);

    const bptIndex = await relayedWeightedPool.getBptIndex();
    initialBalances = Array.from({ length: NUM_TOKENS + 1 }).map((_, i) => (i == bptIndex ? 0 : fp(1 - i / 10)));

    await allTokens.approve({ from: deployer, to: relayedWeightedPool.vault });
    await allTokens.approve({ from: user, to: relayedWeightedPool.vault });

    const actionJoin = await actionId(relayedWeightedPool.vault.instance, 'joinPool');
    const actionExit = await actionId(relayedWeightedPool.vault.instance, 'exitPool');

    if (relayedWeightedPool.vault.authorizer != null) {
      await relayedWeightedPool.vault.authorizer.grantPermissions([actionJoin], relayedWeightedPool.relayer.address, [
        ANY_ADDRESS,
      ]);
      await relayedWeightedPool.vault.authorizer.grantPermissions([actionExit], relayedWeightedPool.relayer.address, [
        ANY_ADDRESS,
      ]);
    }

    await relayedWeightedPool.vault.instance
      .connect(user)
      .setRelayerApproval(user.address, relayedWeightedPool.relayer.address, true);
    await relayedWeightedPool.vault.instance.setRelayerApproval(
      deployer.address,
      relayedWeightedPool.relayer.address,
      true
    );
  });

  describe('General tests', function () {
    it('Smoke test', async function () {
      expect(await relayedWeightedPool.name()).is.eq('Balancer Pool Token');
      expect(await relayedWeightedPool.symbol()).is.eq('BPT');
      expect(await relayedWeightedPool.getSwapFeePercentage()).is.eq(bn(1e12));
    });

    it('Owner can initialize relayedWeightedPool', async function () {
      await relayedWeightedPool.initRelayer({ recipient, initialBalances });
      const tokenInfo = await relayedWeightedPool.vault.getPoolTokenInfo(relayedWeightedPool.poolId, tokens.first);
      expect(tokenInfo.cash).is.eq(initialBalances[0]);
      expect(tokenInfo.managed).is.eq(0);
    });

    it('User should be able to join/exit via Relayer', async function () {
      await relayedWeightedPool.initRelayer({ recipient: deployer, initialBalances: initialBalances });

      const amountsIn = [fp(1), fp(1)];
      const minimumBptOut = bn(0);
      await relayedWeightedPool.joinGivenInRelayer({ amountsIn, minimumBptOut, recipient: user, from: user });
      const tokenInfo1 = await relayedWeightedPool.getTokenInfo(tokens.first);
      const expectedToken0Balance = bn(initialBalances[0]).add(amountsIn[0]);
      expect(tokenInfo1.cash).is.eq(expectedToken0Balance);
      expect(tokenInfo1.managed).is.eq(0);

      const bptBalance = await relayedWeightedPool.balanceOf(user.address);
      expect(bptBalance).is.gt(0);

      await relayedWeightedPool.singleExitGivenInRelayer({ from: user, bptIn: bptBalance, token: tokens.first });

      const tokenInfo2 = await relayedWeightedPool.getTokenInfo(tokens.first);
      expect(tokenInfo2.cash).is.lt(expectedToken0Balance);
      expect(tokenInfo2.managed).is.eq(0);
      expect(await relayedWeightedPool.balanceOf(user.address)).is.eq(0);
    });

    it('Only Relayer should be able to join', async function () {
      await relayedWeightedPool.initRelayer({ recipient: deployer, initialBalances: initialBalances });
      const amountsIn = [fp(1), fp(1)];
      const minimumBptOut = bn(0);
      await expect(
        relayedWeightedPool.joinGivenIn({ amountsIn, minimumBptOut, recipient: user, from: user })
      ).is.revertedWith('BASE_POOL_RELAYER_NOT_CALLED');
    });

    it('Only Relayer should be able to exit', async function () {
      await relayedWeightedPool.initRelayer({ recipient: deployer, initialBalances: initialBalances });
      const bptBalance = await relayedWeightedPool.balanceOf(deployer.address);
      await expect(
        relayedWeightedPool.singleExitGivenIn({ from: deployer, bptIn: bptBalance, token: tokens.first })
      ).is.revertedWith('BASE_POOL_RELAYER_NOT_CALLED');
    });

    it('Pool should return relayer address', async function () {
      expect(await relayedWeightedPool.getRelayer()).is.eq(relayedWeightedPool.relayer.address);
    });
  });
});

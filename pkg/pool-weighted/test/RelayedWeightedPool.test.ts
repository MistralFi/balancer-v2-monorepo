import { expect } from 'chai';
import { bn, fp } from '@balancer-labs/v2-helpers/src/numbers';

import TokenList from '@balancer-labs/v2-helpers/src/models/tokens/TokenList';
import WeightedPool from '@balancer-labs/v2-helpers/src/models/pools/weighted/WeightedPool';
import { WeightedPoolType } from '@balancer-labs/v2-helpers/src/models/pools/weighted/types';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { range } from 'lodash';
import { ethers } from 'hardhat';
import { actionId } from '@balancer-labs/v2-helpers/src/models/misc/actions';
import { ANY_ADDRESS } from '@balancer-labs/v2-helpers/src/constants';

describe('RelayedWeightedPool tests', function () {
  let allTokens: TokenList;
  let relayedWeightedPool: WeightedPool;
  let tokens: TokenList;
  let deployer: SignerWithAddress;
  let user: SignerWithAddress;
  let recipient: SignerWithAddress;
  const MAX_TOKENS = 20;
  const NUM_TOKENS = 2;
  const POOL_SWAP_FEE_PERCENTAGE = fp(0.01);
  const WEIGHTS = range(1000, 1000 + MAX_TOKENS); // These will be normalized to weights that are close to each other, but different
  const INITIAL_BALANCES = [fp(0.9), fp(1.8), fp(2.7), fp(3.6)];
  const initialBalances = INITIAL_BALANCES.slice(0, NUM_TOKENS);

  before('setup signers', async () => {
    [deployer, user] = await ethers.getSigners();
  });

  sharedBeforeEach('deploy tokens', async () => {
    allTokens = await TokenList.create(MAX_TOKENS, { sorted: true, varyDecimals: true });
    tokens = allTokens.subset(NUM_TOKENS);
    await allTokens.mint({ to: deployer, amount: fp(100) });
    await allTokens.mint({ to: user, amount: fp(100) });
    relayedWeightedPool = await WeightedPool.create({
      poolType: WeightedPoolType.RELAYED_WEIGHTED_POOL,
      tokens,
      weights: WEIGHTS.slice(0, NUM_TOKENS),
      swapFeePercentage: POOL_SWAP_FEE_PERCENTAGE,
      fromFactory: true,
    });
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
      expect(await relayedWeightedPool.getSwapFeePercentage()).is.eq(fp(0.01));
    });

    it('Owner can initialize relayedWeightedPool', async function () {
      await relayedWeightedPool.initRelayer({ recipient, initialBalances });
      const tokenInfo = await relayedWeightedPool.vault.getPoolTokenInfo(relayedWeightedPool.poolId, tokens.first);
      expect(tokenInfo.cash).is.eq(initialBalances[0]);
      expect(tokenInfo.managed).is.eq(0);
    });

    it('User should be able to join/exit via Relayer', async function () {
      await relayedWeightedPool.init({ recipient: deployer, initialBalances: initialBalances });

      const amountsIn = [fp(1), fp(1)];
      const minimumBptOut = bn(0);
      await relayedWeightedPool.joinGivenInRelayer({ amountsIn, minimumBptOut, recipient: user, from: user });
      const tokenInfo1 = await relayedWeightedPool.getTokenInfo(tokens.first);
      const expectedToken0Balance = initialBalances[0].add(amountsIn[0]);
      expect(tokenInfo1.cash).is.eq(expectedToken0Balance);
      expect(tokenInfo1.managed).is.eq(0);

      const bptBalance = await relayedWeightedPool.balanceOf(user.address);
      expect(bptBalance).is.gt(0);

      await relayedWeightedPool.multiExitGivenInRelayer({ from: user, bptIn: bptBalance });

      const tokenInfo2 = await relayedWeightedPool.getTokenInfo(tokens.first);
      expect(tokenInfo2.cash).is.lt(expectedToken0Balance);
      expect(tokenInfo2.managed).is.eq(0);
      expect(await relayedWeightedPool.balanceOf(user.address)).is.eq(0);
    });

    it('Only Relayer should be able to join', async function () {
      await relayedWeightedPool.init({ recipient: deployer, initialBalances: initialBalances });
      const amountsIn = [fp(1), fp(1)];
      const minimumBptOut = bn(0);
      await expect(
        relayedWeightedPool.joinGivenIn({ amountsIn, minimumBptOut, recipient: user, from: user })
      ).is.revertedWith('Only relayer can join pool');
    });

    it('Only Relayer should be able to exit', async function () {
      await relayedWeightedPool.init({ recipient: deployer, initialBalances: initialBalances });
      const bptBalance = await relayedWeightedPool.balanceOf(deployer.address);
      await expect(relayedWeightedPool.multiExitGivenIn({ from: deployer, bptIn: bptBalance })).is.revertedWith(
        'Only relayer can exit pool'
      );
    });

    it('Pool should return relayer address', async function () {
      expect(await relayedWeightedPool.getRelayer()).is.eq(relayedWeightedPool.relayer.address);
    });
  });
});

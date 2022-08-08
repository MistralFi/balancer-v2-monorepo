import chai from 'chai';
import { solidity } from 'ethereum-waffle';
import TokenList from '@balancer-labs/v2-helpers/src/models/tokens/TokenList';
import { bn, fp } from '@balancer-labs/v2-helpers/src/numbers';
import { range } from 'lodash';
import WeightedPool from '@balancer-labs/v2-helpers/src/models/pools/weighted/WeightedPool';
import { WeightedPoolType } from '@balancer-labs/v2-helpers/src/models/pools/weighted/types';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';
import { ethers } from 'hardhat';
import Vault from '@balancer-labs/v2-helpers/src/models/vault/Vault';
import { deploy } from '@balancer-labs/v2-helpers/src/contract';
import { Contract } from 'ethers';
import { encodeInvestmentConfig } from './helpers/rebalance';
import { ANY_ADDRESS, ZERO_ADDRESS } from '@balancer-labs/v2-helpers/src/constants';
import { actionId } from '@balancer-labs/v2-helpers/src/models/misc/actions';
import Token from '@balancer-labs/v2-helpers/src/models/tokens/Token';

const { expect } = chai;
chai.use(solidity);

const tokenInitialBalance = fp(200);
const POOL_SWAP_FEE_PERCENTAGE = fp(0.01);
const MAX_TOKENS = 2;
const WEIGHTS = range(1000, 1000 + MAX_TOKENS); // These will be normalized to weights that are close to each other, but different
const INITIAL_BALANCES = [fp(0.9), fp(1.8), fp(2.7), fp(3.6)];
const initialBalances = INITIAL_BALANCES.slice(0, MAX_TOKENS);

const targetPercentage = fp(0.8);
const upperCriticalPercentage = fp(0.9);
const lowerCriticalPercentage = fp(0.1);

describe('ERC4626AssetManager tests', function () {
  let tokens: TokenList,
    vault: Vault,
    tetuVault: Contract,
    relayer: Contract,
    rewardsCollector: SignerWithAddress,
    gague: Contract,
    assetManager: Contract,
    pool: WeightedPool,
    rt: Token;

  let deployer: SignerWithAddress;
  let user: SignerWithAddress;
  let vaultFeeCollector: SignerWithAddress;
  let poolId: string;

  const setup = async (
    isReturnShares = true,
    isReturnTokens = true,
    isGage = true,
    gagueReturnAmount = bn(100),
    assetManagerImplementation = 'ERC4626AssetManager'
  ) => {
    //todo rewardsCollector should use feeForwarder?
    [deployer, user, rewardsCollector, vaultFeeCollector] = await ethers.getSigners();

    tokens = await TokenList.create(['DAI', 'MKR'], { sorted: true });
    rt = (await TokenList.create(['RT'])).RT;

    // Deploy Balancer Vault
    vault = await Vault.create();
    tetuVault = await deploy('Mock4626VaultV2', {
      args: [tokens.first.address, 'TetuT0', 'TetuT0', isReturnShares, isReturnTokens, vaultFeeCollector.address],
    });

    gague = await deploy('MockGague', {
      args: [[rt.address], [gagueReturnAmount], tetuVault.address],
    });

    // Deploy Asset manager
    assetManager = await deploy(assetManagerImplementation, {
      args: [
        vault.address,
        tetuVault.address,
        tokens.DAI.address,
        rewardsCollector.address,
        isGage ? gague.address : ZERO_ADDRESS,
      ],
    });

    // Deploy Pool
    pool = await WeightedPool.create({
      poolType: WeightedPoolType.RELAYED_WEIGHTED_POOL,
      tokens,
      weights: WEIGHTS.slice(0, tokens.length),
      swapFeePercentage: POOL_SWAP_FEE_PERCENTAGE,
      fromFactory: true,
      assetManagers: [assetManager.address, ethers.constants.AddressZero],
      vault: vault,
      owner: deployer,
    });

    poolId = await pool.getPoolId();

    //todo add factory
    await assetManager.initialize(poolId);

    const config = {
      targetPercentage: targetPercentage,
      upperCriticalPercentage: upperCriticalPercentage,
      lowerCriticalPercentage: lowerCriticalPercentage,
    };
    await pool.instance.setAssetManagerPoolConfig(tokens.first.address, encodeInvestmentConfig(config));

    await tokens.mint({ to: user, amount: tokenInitialBalance.mul(2) });
    await tokens.mint({ to: deployer, amount: tokenInitialBalance.mul(2) });
    await tokens.approve({ to: vault.address, from: [user, deployer] });

    const actionJoin = await actionId(pool.vault.instance, 'joinPool');
    const actionExit = await actionId(pool.vault.instance, 'exitPool');

    if (pool.vault.authorizer != null) {
      await pool.vault.authorizer.grantPermissions([actionJoin], pool.relayer.address, [ANY_ADDRESS]);
      await pool.vault.authorizer.grantPermissions([actionExit], pool.relayer.address, [ANY_ADDRESS]);
    }

    await pool.vault.instance.connect(user).setRelayerApproval(user.address, pool.relayer.address, true);

    await pool.init({ recipient: deployer, initialBalances });
    relayer = pool.relayer;
  };

  beforeEach('set up asset manager', async () => {
    await setup();
  });

  describe('General tests', function () {
    it('Smoke test', async function () {
      expect(await assetManager.getToken()).is.eq(tokens.first.address);
      expect(await assetManager.maxInvestableBalance(poolId)).is.eq(bn(720000000000000000));
    });

    it('Max investable balance tests', async function () {
      const expectedToBeInvested = initialBalances[0].mul(targetPercentage).div(fp(1));
      expect(await assetManager.maxInvestableBalance(poolId)).is.eq(expectedToBeInvested);
      await assetManager.rebalance(poolId, false);
      expect(await assetManager.maxInvestableBalance(poolId)).is.eq(0);
      const config = {
        targetPercentage: targetPercentage.div(2),
        upperCriticalPercentage: upperCriticalPercentage,
        lowerCriticalPercentage: lowerCriticalPercentage,
      };
      await pool.setAssetManagerPoolConfig(tokens.first, encodeInvestmentConfig(config));
      expect(await assetManager.maxInvestableBalance(poolId)).is.eq(expectedToBeInvested.div(2).mul(-1));
    });

    it('Only rebalancer can call capitalOut from AM', async function () {
      await expect(assetManager.capitalOut(poolId, '100')).is.revertedWith('Only callable by authorized rebalancer');
    });

    it('Only real poolID allowed for maxInvestableBalance', async function () {
      const nonExistingPoolId = '0xc11111111111111111175d088814bf32b1f5d7c9000200000000000000000000';
      await expect(assetManager.updateBalanceOfPool(nonExistingPoolId)).is.revertedWith(
        'AssetManager called with incorrect poolId'
      );
    });

    it('Initialize can be call only once', async function () {
      await expect(assetManager.initialize(poolId)).is.revertedWith('Already initialised');
    });

    it("poolID can't be empty during the initialization", async function () {
      const assetManager = await deploy('ERC4626AssetManager', {
        args: [vault.address, tetuVault.address, tokens.DAI.address, rewardsCollector.address, gague.address],
      });
      const nonExistingPoolId = '0x0000000000000000000000000000000000000000000000000000000000000000';
      await expect(assetManager.initialize(nonExistingPoolId)).is.revertedWith('Pool id cannot be empty');
    });

    it("underlying can't be empty during the initialization", async function () {
      await expect(
        deploy('ERC4626AssetManager', {
          args: [vault.address, tetuVault.address, ZERO_ADDRESS, rewardsCollector.address, gague.address],
        })
      ).is.revertedWith('zero token');
    });

    it("Balancer vault can't be empty during the initialization", async function () {
      await expect(
        deploy('ERC4626AssetManager', {
          args: [ZERO_ADDRESS, tetuVault.address, tokens.DAI.address, rewardsCollector.address, gague.address],
        })
      ).is.revertedWith('zero balancer vault');
    });

    it("Tetu vault can't be empty during the initialization", async function () {
      await expect(
        deploy('ERC4626AssetManager', {
          args: [vault.address, ZERO_ADDRESS, tokens.DAI.address, rewardsCollector.address, gague.address],
        })
      ).is.revertedWith('zero ERC4626 vault');
    });

    it("rewardCollector can't be empty during the initialization", async function () {
      await expect(
        deploy('ERC4626AssetManager', {
          args: [vault.address, tetuVault.address, tokens.DAI.address, ZERO_ADDRESS, gague.address],
        })
      ).is.revertedWith('zero rewardCollector');
    });

    it('AM should not invest in tetu vault if vault not returns receipt tokens', async function () {
      await setup(false, true);
      await expect(assetManager.rebalance(poolId, false)).is.revertedWith('AM should receive shares after the deposit');
    });

    it('AM should not withdraw from tetu vault if vault not returns tokens', async function () {
      await setup(true, false);
      await assetManager.rebalance(poolId, false);

      const config = {
        targetPercentage: 0,
        upperCriticalPercentage: 0,
        lowerCriticalPercentage: 0,
      };
      await pool.setAssetManagerPoolConfig(tokens.first, encodeInvestmentConfig(config));
      await expect(assetManager.rebalance(poolId, false)).is.revertedWith(
        'AM should receive requested tokens after the withdraw'
      );
    });
  });

  describe('Invest', function () {
    it('AM should be able to invest funds to the TetuVault', async function () {
      const t0ToDeposit = fp(1);
      const t1ToDeposit = fp(1);
      await pool.joinGivenInRelayer({ amountsIn: [t0ToDeposit, t1ToDeposit], from: user });
      expect(await pool.balanceOf(user.address)).is.not.equal(0);

      const tx = await assetManager.rebalance(poolId, false);
      const receipt = await tx.wait();
      expect(receipt.gasUsed).is.lt(70000, 'Pool Rebalance transaction consumes more gas than expected');

      const balances = await vault.getPoolTokenInfo(poolId, tokens.first);
      const expectedToBeInTetuVault = initialBalances[0].add(t0ToDeposit).mul(targetPercentage).div(fp(1));

      const expectedToBeInBalVault = initialBalances[0].add(t0ToDeposit).sub(expectedToBeInTetuVault);

      expect(await assetManager.getAUM(poolId)).is.eq(expectedToBeInTetuVault);

      const [poolCash, poolManaged] = await assetManager.getPoolBalances(poolId);
      expect(poolCash).is.eq(expectedToBeInBalVault);
      expect(poolManaged).is.eq(expectedToBeInTetuVault);

      expect(balances.cash).is.equal(expectedToBeInBalVault);
      expect(balances.managed).is.equal(expectedToBeInTetuVault);
      expect(await tokens.first.balanceOf(tetuVault.address)).is.equal(expectedToBeInTetuVault);
    });
  });

  describe('Rebalance', function () {
    it('AM should be able to force rebalance', async function () {
      const expectedToBeControlledByAM = initialBalances[0].mul(targetPercentage).div(fp(1));
      await assetManager.rebalance(poolId, false);
      expect(await assetManager.getAUM(poolId)).is.eq(expectedToBeControlledByAM);
      const t0ToDeposit = fp(1);
      const t1ToDeposit = fp(1);
      await pool.joinGivenInRelayer({ amountsIn: [t0ToDeposit, t1ToDeposit], from: user });

      // this call should not change the AUM because deposit is in allowed range
      await assetManager.rebalance(poolId, false);
      expect(await assetManager.getAUM(poolId)).is.eq(expectedToBeControlledByAM);
      // but force should
      await assetManager.rebalance(poolId, true);

      const expectedToBeControlledByAMAfterDeposit = initialBalances[0]
        .add(t0ToDeposit)
        .mul(targetPercentage)
        .div(fp(1));
      expect(await assetManager.getAUM(poolId)).is.eq(expectedToBeControlledByAMAfterDeposit);
    });

    it('Force rebalance should work properly in no rebalance needed', async function () {
      await assetManager.rebalance(poolId, false);
      const [poolCash1, poolManaged1] = await assetManager.getPoolBalances(poolId);

      await assetManager.rebalance(poolId, true);
      const [poolCash2, poolManaged2] = await assetManager.getPoolBalances(poolId);
      expect(poolCash1).is.eq(poolCash2);
      expect(poolManaged1).is.eq(poolManaged2);
    });

    it('AM should properly handle extra tokens', async function () {
      const extraTokens = bn(100);
      await tokens.first.transfer(assetManager.address, extraTokens);
      await assetManager.rebalance(poolId, false);
      expect(await tokens.first.balanceOf(assetManager.address)).is.eq(extraTokens);
    });

    it('Relayer should disallows reentrancy on join operation', async function () {
      await setup(true, true, true, bn(100), 'MockReentrantAssetManager');
      const t0ToDeposit = fp(10);
      const t1ToDeposit = fp(10);
      await expect(pool.joinGivenInRelayer({ from: user, amountsIn: [t0ToDeposit, t1ToDeposit] })).is.revertedWith(
        'Rebalancing relayer reentered'
      );
    });

    it('AM should properly calculate amounts for vault with fee', async function () {
      await tetuVault.setFeeNom(bn(10));
      await assetManager.rebalance(poolId, false);

      const [poolCash, poolManaged] = await assetManager.getPoolBalances(poolId);
      expect(poolCash).is.eq(bn('180000000000000000'));
      // 180000000000000000 - 10%
      expect(poolManaged).is.eq(bn('648000000000000000'));
    });
  });

  describe('Withdraw', function () {
    it('AM should be able to handle exit from pool when funds in vault is not enough', async function () {
      const t0ToDeposit = fp(30);
      const t1ToDeposit = fp(30);
      await pool.joinGivenInRelayer({ amountsIn: [t0ToDeposit, t1ToDeposit], from: user });

      expect(await pool.balanceOf(user.address)).is.not.equal(0);

      await assetManager.rebalance(poolId, false);

      const [poolCash] = await assetManager.getPoolBalances(poolId);

      const bptBalanceBefore = await pool.balanceOf(user.address);
      const token0BalBefore = await tokens.first.balanceOf(user.address);

      const token0ToWithdraw = poolCash.add(bn(10));
      const tx = await pool.exitGivenOutRelayer({
        amountsOut: [token0ToWithdraw, bn(0)],
        maximumBptIn: bptBalanceBefore,
        from: user,
      });
      const receipt = await tx.wait();
      expect(receipt.gasUsed).is.lt(430000, 'Pool withdraw transaction consumes more gas than expected');

      const token0BalAfter = await tokens.first.balanceOf(user.address);
      expect(token0BalAfter).is.eq(token0BalBefore.add(token0ToWithdraw));
    });

    it('Rebalancer should be able to return funds to the balancer vault onJoin', async function () {
      await assetManager.rebalance(poolId, false);
      let poolManaged;
      [, poolManaged] = await assetManager.getPoolBalances(poolId);
      expect(poolManaged).is.gt(0);

      const config = {
        targetPercentage: 0,
        upperCriticalPercentage: 0,
        lowerCriticalPercentage: 0,
      };
      await pool.setAssetManagerPoolConfig(tokens.first, encodeInvestmentConfig(config));

      const t0ToDeposit = fp(5);
      const t1ToDeposit = fp(5);
      await pool.joinGivenInRelayer({ amountsIn: [t0ToDeposit, t1ToDeposit], from: user });
      [, poolManaged] = await assetManager.getPoolBalances(poolId);
      expect(poolManaged).is.eq(0);
    });
  });

  describe('AM Config tests', function () {
    it('Only pool should be able to update config', async function () {
      const config = {
        targetPercentage: 0,
        upperCriticalPercentage: 0,
        lowerCriticalPercentage: 0,
      };
      await expect(assetManager.setConfig(poolId, encodeInvestmentConfig(config))).is.revertedWith(
        'Only callable by pool'
      );
    });

    it('upperCriticalPercentage could not be higher than 100%', async function () {
      const config = {
        targetPercentage: 0,
        upperCriticalPercentage: fp(10),
        lowerCriticalPercentage: 0,
      };
      await expect(pool.setAssetManagerPoolConfig(tokens.first, encodeInvestmentConfig(config))).is.revertedWith(
        'Upper critical level must be less than or equal to 100%'
      );
    });

    it('targetPercentage could not be higher upperCriticalPercentage', async function () {
      const config = {
        targetPercentage: fp(0.9).add(1),
        upperCriticalPercentage: fp(0.9),
        lowerCriticalPercentage: 0,
      };
      await expect(pool.setAssetManagerPoolConfig(tokens.first, encodeInvestmentConfig(config))).is.revertedWith(
        'Target must be less than or equal to upper critical level'
      );
    });

    it('lowerCriticalPercentage could not be higher targetPercentage', async function () {
      const config = {
        targetPercentage: 0,
        upperCriticalPercentage: fp(0.9),
        lowerCriticalPercentage: fp(0.9).add(1),
      };
      await expect(pool.setAssetManagerPoolConfig(tokens.first, encodeInvestmentConfig(config))).is.revertedWith(
        'Lower critical level must be less than or equal to target'
      );
    });
  });

  describe('Claim gague rewards', function () {
    it('Relayer should be able to claim rewards', async function () {
      // simulate rewards
      await rt.mint(gague.address, bn(150));
      const feeCollectorBalBefore = await rt.balanceOf(rewardsCollector.address);
      await relayer.claimAssetManagerRewards(poolId);
      const feeCollectorBalAfter = await rt.balanceOf(rewardsCollector.address);
      expect(feeCollectorBalAfter).is.gt(feeCollectorBalBefore);
      expect(feeCollectorBalAfter).is.eq(bn(100));
    });

    it('Relayer should process claim transaction with empty gague', async function () {
      await setup(true, true, false);
      await rt.mint(gague.address, bn(150));
      const feeCollectorBalBefore = await rt.balanceOf(rewardsCollector.address);
      await relayer.claimAssetManagerRewards(poolId);
      const feeCollectorBalAfter = await rt.balanceOf(rewardsCollector.address);
      expect(feeCollectorBalAfter).is.eq(feeCollectorBalBefore);
    });

    it('Relayer should process claim transaction when no gague rewards', async function () {
      await setup(true, true, true, bn(0));
      const feeCollectorBalBefore = await rt.balanceOf(rewardsCollector.address);
      await relayer.claimAssetManagerRewards(poolId);
      const feeCollectorBalAfter = await rt.balanceOf(rewardsCollector.address);
      expect(feeCollectorBalAfter).is.eq(feeCollectorBalBefore);
    });
  });
});

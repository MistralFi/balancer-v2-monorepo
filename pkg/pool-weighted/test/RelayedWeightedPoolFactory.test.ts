import { ethers } from 'hardhat';
import { expect } from 'chai';
import { BigNumber, Contract } from 'ethers';

import { fp } from '@balancer-labs/v2-helpers/src/numbers';
import { advanceTime, currentTimestamp, MONTH } from '@balancer-labs/v2-helpers/src/time';
import * as expectEvent from '@balancer-labs/v2-helpers/src/test/expectEvent';
import { ZERO_ADDRESS } from '@balancer-labs/v2-helpers/src/constants';
import { deploy, deployedAt } from '@balancer-labs/v2-helpers/src/contract';

import Vault from '@balancer-labs/v2-helpers/src/models/vault/Vault';
import TokenList from '@balancer-labs/v2-helpers/src/models/tokens/TokenList';
import { toNormalizedWeights } from '@balancer-labs/balancer-js';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { RelayedWeightedPoolFactoryParams } from '@balancer-labs/v2-helpers/src/models/pools/weighted/types';

describe('RelayedWeightedPoolFactory', function () {
  let tokens: TokenList;
  let factory: Contract;
  let vault: Vault;
  let swapFeeController: Contract;
  let relayer: Contract;
  let tetuVault: Contract;
  let assetManagers: string[];
  let assetManager: Contract, owner: SignerWithAddress;

  const NAME = 'Balancer Pool Token';
  const SYMBOL = 'BPT';
  const POOL_SWAP_FEE_PERCENTAGE = fp(0.01);
  const WEIGHTS = toNormalizedWeights([fp(30), fp(70), fp(5), fp(5)]);

  const BASE_PAUSE_WINDOW_DURATION = MONTH * 3;
  const BASE_BUFFER_PERIOD_DURATION = MONTH;

  let createTime: BigNumber;

  before('setup signers', async () => {
    [, , owner] = await ethers.getSigners();
  });

  sharedBeforeEach('deploy factory & tokens', async () => {
    vault = await Vault.create();
    swapFeeController = await deploy('v2-pool-utils/swapfees/SwapFeeController', {
      args: [vault.address, fp(0.01), fp(0.0001), fp(0.0004), fp(0.0025)],
    });
    relayer = await deploy('v2-asset-manager-utils/Relayer', { args: [vault.address] });

    factory = await deploy('RelayedWeightedPoolFactory', {
      args: [vault.address, relayer.address, swapFeeController.address],
    });

    createTime = await currentTimestamp();

    tokens = await TokenList.create(['MKR', 'DAI', 'SNX', 'BAT'], { sorted: true });

    tetuVault = await deploy('v2-asset-manager-utils/test/Mock4626VaultV2', {
      args: [tokens.first.address, 'TetuT0', 'TetuT0', true, true, swapFeeController.address],
    });

    assetManagers = Array(tokens.length).fill(ZERO_ADDRESS);

    // Deploy Asset manager
    assetManager = await deploy('v2-asset-manager-utils/ERC4626AssetManager', {
      args: [vault.address, tetuVault.address, tokens.DAI.address, swapFeeController.address, ZERO_ADDRESS],
    });
    assetManagers[0] = assetManager.address;
  });

  async function createPool(): Promise<Contract> {
    const newPoolParams: RelayedWeightedPoolFactoryParams = {
      name: NAME,
      symbol: SYMBOL,
      tokens: tokens.addresses,
      normalizedWeights: WEIGHTS,
      assetManagers: assetManagers,
      owner: owner.address,
    };

    const receipt = await (await factory.create(newPoolParams)).wait();
    const event = expectEvent.inReceipt(receipt, 'PoolCreated');
    return deployedAt('RelayedWeightedPool', event.args.pool);
  }

  describe('constructor arguments', () => {
    let pool: Contract;

    sharedBeforeEach(async () => {
      pool = await createPool();
    });

    it('sets the vault', async () => {
      expect(await pool.getVault()).to.equal(vault.address);
      expect(await pool.getRelayer()).to.equal(relayer.address);
    });

    it('assetManager should be initialized during pool construction', async () => {
      const nonExistingPoolId = '0xc11111111111111111175d088814bf32b1f5d7c9000200000000000000000000';
      await expect(assetManager.initialize(nonExistingPoolId)).revertedWith('Already initialised');
    });

    it('sets the swapFeeController', async () => {
      expect(await pool.getSwapFeeController()).to.equal(swapFeeController.address);
    });

    it('registers tokens in the vault', async () => {
      const poolId = await pool.getPoolId();
      const poolTokens = await vault.getPoolTokens(poolId);

      expect(poolTokens.tokens).to.have.members(tokens.addresses);
      expect(poolTokens.balances).to.be.zeros;
    });

    it('starts with no BPT', async () => {
      expect(await pool.totalSupply()).to.be.equal(0);
    });

    it('sets the asset managers', async () => {
      await tokens.asyncEach(async (token, i) => {
        const poolId = await pool.getPoolId();
        const info = await vault.getPoolTokenInfo(poolId, token);
        expect(info.assetManager).to.equal(assetManagers[i]);
      });
    });

    it('sets swap fee', async () => {
      expect(await pool.getSwapFeePercentage()).to.equal(POOL_SWAP_FEE_PERCENTAGE);
    });

    it('sets the owner ', async () => {
      expect(await pool.getOwner()).to.equal(owner.address);
    });

    it('sets the name', async () => {
      expect(await pool.name()).to.equal('Balancer Pool Token');
    });

    it('sets the symbol', async () => {
      expect(await pool.symbol()).to.equal('BPT');
    });

    it('sets the decimals', async () => {
      expect(await pool.decimals()).to.equal(18);
    });
  });

  describe('temporarily pausable', () => {
    it('pools have the correct window end times', async () => {
      const pool = await createPool();
      const { pauseWindowEndTime, bufferPeriodEndTime } = await pool.getPausedState();

      expect(pauseWindowEndTime).to.equal(createTime.add(BASE_PAUSE_WINDOW_DURATION));
      expect(bufferPeriodEndTime).to.equal(createTime.add(BASE_PAUSE_WINDOW_DURATION + BASE_BUFFER_PERIOD_DURATION));
    });

    it('multiple pools have the same window end times', async () => {
      const firstPool = await createPool();
      await advanceTime(BASE_PAUSE_WINDOW_DURATION / 3);
      assetManagers[0] = (
        await deploy('v2-asset-manager-utils/ERC4626AssetManager', {
          args: [vault.address, tetuVault.address, tokens.DAI.address, swapFeeController.address, ZERO_ADDRESS],
        })
      ).address;
      const secondPool = await createPool();

      const { firstPauseWindowEndTime, firstBufferPeriodEndTime } = await firstPool.getPausedState();
      const { secondPauseWindowEndTime, secondBufferPeriodEndTime } = await secondPool.getPausedState();

      expect(firstPauseWindowEndTime).to.equal(secondPauseWindowEndTime);
      expect(firstBufferPeriodEndTime).to.equal(secondBufferPeriodEndTime);
    });

    it('pools created after the pause window end date have no buffer period', async () => {
      await advanceTime(BASE_PAUSE_WINDOW_DURATION + 1);
      assetManagers[0] = (
        await deploy('v2-asset-manager-utils/ERC4626AssetManager', {
          args: [vault.address, tetuVault.address, tokens.DAI.address, swapFeeController.address, ZERO_ADDRESS],
        })
      ).address;
      const pool = await createPool();
      const { pauseWindowEndTime, bufferPeriodEndTime } = await pool.getPausedState();
      const now = await currentTimestamp();

      expect(pauseWindowEndTime).to.equal(now);
      expect(bufferPeriodEndTime).to.equal(now);
    });
  });
});

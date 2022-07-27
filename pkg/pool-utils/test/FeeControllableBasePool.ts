import { ethers } from 'hardhat';
import { expect } from 'chai';
import { Contract } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';

import TokenList from '@balancer-labs/v2-helpers/src/models/tokens/TokenList';
import { MONTH } from '@balancer-labs/v2-helpers/src/time';
import { deploy } from '@balancer-labs/v2-helpers/src/contract';
import { PoolSpecialization } from '@balancer-labs/balancer-js';
import { BigNumberish, fp } from '@balancer-labs/v2-helpers/src/numbers';
import { ZERO_ADDRESS } from '@balancer-labs/v2-helpers/src/constants';
import { Account } from '@balancer-labs/v2-helpers/src/models/types/types';
import TypesConverter from '@balancer-labs/v2-helpers/src/models/types/TypesConverter';

describe('FeeControllableBasePool.test', function () {
  let admin: SignerWithAddress, other: SignerWithAddress;
  let authorizer: Contract, vault: Contract, swapFeeController: Contract;
  let tokens: TokenList;

  const DEFAULT_MIN_SWAP_FEE_PERCENTAGE_STABLE_BC_POOL = fp(0.0001);
  const DEFAULT_MIN_SWAP_FEE_PERCENTAGE_STABLE_EX_POOL = fp(0.0004);
  const DEFAULT_MIN_SWAP_FEE_PERCENTAGE_REGULAR_POOL = fp(0.0025);
  const DEFAULT_MAX_SWAP_FEE_PERCENTAGE = fp(0.01);

  before(async () => {
    [, admin, other] = await ethers.getSigners();
  });

  sharedBeforeEach(async () => {
    authorizer = await deploy('v2-vault/TimelockAuthorizer', { args: [admin.address, ZERO_ADDRESS, MONTH] });
    vault = await deploy('v2-vault/Vault', { args: [authorizer.address, ZERO_ADDRESS, 0, 0] });
    tokens = await TokenList.create(['DAI', 'MKR', 'SNX'], { sorted: true });
    swapFeeController = await deploy('SwapFeeController', {
      args: [
        vault.address,
        DEFAULT_MAX_SWAP_FEE_PERCENTAGE,
        DEFAULT_MIN_SWAP_FEE_PERCENTAGE_STABLE_BC_POOL,
        DEFAULT_MIN_SWAP_FEE_PERCENTAGE_STABLE_EX_POOL,
        DEFAULT_MIN_SWAP_FEE_PERCENTAGE_REGULAR_POOL,
      ],
    });
  });

  function deployBasePool(
    params: {
      tokens?: TokenList | string[];
      assetManagers?: string[];
      swapFeePercentage?: BigNumberish;
      pauseWindowDuration?: number;
      bufferPeriodDuration?: number;
      owner?: Account;
      from?: SignerWithAddress;
    } = {}
  ): Promise<Contract> {
    let {
      tokens: poolTokens,
      assetManagers,
      swapFeePercentage,
      pauseWindowDuration,
      bufferPeriodDuration,
      owner,
    } = params;
    if (!poolTokens) poolTokens = tokens;
    if (!assetManagers) assetManagers = Array(poolTokens.length).fill(ZERO_ADDRESS);
    if (!swapFeePercentage) swapFeePercentage = DEFAULT_MAX_SWAP_FEE_PERCENTAGE;
    if (!pauseWindowDuration) pauseWindowDuration = MONTH;
    if (!bufferPeriodDuration) bufferPeriodDuration = 0;
    if (!owner) owner = ZERO_ADDRESS;

    return deploy('MockSwapFeeControllableBasePool', {
      from: params.from,
      args: [
        vault.address,
        PoolSpecialization.GeneralPool,
        'Balancer Pool Token',
        'BPT',
        Array.isArray(poolTokens) ? poolTokens : poolTokens.addresses,
        assetManagers,
        swapFeePercentage,
        pauseWindowDuration,
        bufferPeriodDuration,
        TypesConverter.toAddress(owner),
        swapFeeController.address,
      ],
    });
  }

  describe('deployment', () => {
    it('Pool should be initialized with default swap fee', async () => {
      const pool = await deployBasePool({
        tokens: tokens.addresses,
        swapFeePercentage: DEFAULT_MAX_SWAP_FEE_PERCENTAGE,
      });
      const poolId = await pool.getPoolId();
      const [poolAddress, poolSpecialization] = await vault.getPool(poolId);
      expect(poolAddress).to.equal(pool.address);
      expect(poolSpecialization).to.equal(PoolSpecialization.GeneralPool);
    });

    it('Pool should not be initialized with swap fee greater than default', async () => {
      await expect(
        deployBasePool({
          tokens: tokens.addresses,
          swapFeePercentage: DEFAULT_MAX_SWAP_FEE_PERCENTAGE.add(1),
        })
      ).is.revertedWith('MAX_SWAP_FEE_PERCENTAGE');
    });

    it('Pool should not be initialized with swap fee lesser than default', async () => {
      await expect(
        deployBasePool({
          tokens: tokens.addresses,
          swapFeePercentage: DEFAULT_MAX_SWAP_FEE_PERCENTAGE.sub(1),
        })
      ).is.revertedWith('MIN_SWAP_FEE_PERCENTAGE');
    });
  });

  describe('swap fee updates', () => {
    let pool: Contract;
    let sender: SignerWithAddress;

    sharedBeforeEach('deploy pool', async () => {
      sender = other;
      pool = await deployBasePool({ owner: sender });
    });

    it('swap fee should be controlled by the swapFeeController and rejected if not allowed', async () => {
      const newSwapFeePercentage = DEFAULT_MAX_SWAP_FEE_PERCENTAGE.sub(1);
      await expect(pool.connect(sender).setSwapFeePercentage(newSwapFeePercentage)).is.revertedWith(
        'SWAP_FEE_DISALLOWED_BY_FEE_CONTROLLER'
      );
    });
  });
});

import { ethers } from 'hardhat';
import { expect } from 'chai';
import { Contract } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';
import { MONTH } from '@balancer-labs/v2-helpers/src/time';
import { deploy } from '@balancer-labs/v2-helpers/src/contract';
import { BigNumberish, fp } from '@balancer-labs/v2-helpers/src/numbers';
import { ANY_ADDRESS, ZERO_ADDRESS } from '@balancer-labs/v2-helpers/src/constants';
import { actionId } from '@balancer-labs/v2-helpers/src/models/misc/actions';

describe('SwapFeeController.test', function () {
  let admin: SignerWithAddress, other: SignerWithAddress;
  let authorizer: Contract, bal_vault: Contract;

  const DEFAULT_MIN_SWAP_FEE_PERCENTAGE_STABLE_BC_POOL = fp(0.0001);
  const DEFAULT_MIN_SWAP_FEE_PERCENTAGE_STABLE_EX_POOL = fp(0.0004);
  const DEFAULT_MIN_SWAP_FEE_PERCENTAGE_REGULAR_POOL = fp(0.0025);
  const DEFAULT_MAX_SWAP_FEE_PERCENTAGE = fp(0.01);

  before(async () => {
    [, admin, other] = await ethers.getSigners();
  });

  sharedBeforeEach(async () => {
    authorizer = await deploy('v2-vault/TimelockAuthorizer', { args: [admin.address, ZERO_ADDRESS, MONTH] });
    const feeForwarder = await deploy('v2-vault/MockForwarder', { args: [] });
    bal_vault = await deploy('v2-vault/Vault', {
      args: [authorizer.address, ZERO_ADDRESS, 0, 0, feeForwarder.address],
    });
  });
  function deploySwapFeeController(
    params: {
      vault?: Contract;
      maxSwapFeePercentage?: BigNumberish;
      minSwapFeePercentageStableBCPool?: BigNumberish;
      minSwapFeePercentageStableExoticPool?: BigNumberish;
      minSwapFeePercentageRegularPool?: BigNumberish;
      from?: SignerWithAddress;
    } = {}
  ): Promise<Contract> {
    let {
      vault,
      maxSwapFeePercentage,
      minSwapFeePercentageStableBCPool,
      minSwapFeePercentageStableExoticPool,
      minSwapFeePercentageRegularPool,
    } = params;
    if (!vault) vault = bal_vault;
    if (!maxSwapFeePercentage) maxSwapFeePercentage = DEFAULT_MAX_SWAP_FEE_PERCENTAGE;
    if (!minSwapFeePercentageStableBCPool)
      minSwapFeePercentageStableBCPool = DEFAULT_MIN_SWAP_FEE_PERCENTAGE_STABLE_BC_POOL;
    if (!minSwapFeePercentageStableExoticPool)
      minSwapFeePercentageStableExoticPool = DEFAULT_MIN_SWAP_FEE_PERCENTAGE_STABLE_EX_POOL;
    if (!minSwapFeePercentageRegularPool)
      minSwapFeePercentageRegularPool = DEFAULT_MIN_SWAP_FEE_PERCENTAGE_REGULAR_POOL;

    return deploy('SwapFeeController', {
      from: params.from,
      args: [
        vault.address,
        maxSwapFeePercentage,
        minSwapFeePercentageStableBCPool,
        minSwapFeePercentageStableExoticPool,
        minSwapFeePercentageRegularPool,
      ],
    });
  }

  describe('smoke tests', () => {
    it('SwapFeeController smoke test', async () => {
      const swapFeeController = await deploySwapFeeController();
      expect(await swapFeeController.maxSwapFeePercentage()).is.eq(DEFAULT_MAX_SWAP_FEE_PERCENTAGE);
      expect(await swapFeeController.minSwapFeePercentageStableBCPool()).is.eq(
        DEFAULT_MIN_SWAP_FEE_PERCENTAGE_STABLE_BC_POOL
      );
      expect(await swapFeeController.minSwapFeePercentageStableExoticPool()).is.eq(
        DEFAULT_MIN_SWAP_FEE_PERCENTAGE_STABLE_EX_POOL
      );
      expect(await swapFeeController.minSwapFeePercentageRegularPool()).is.eq(
        DEFAULT_MIN_SWAP_FEE_PERCENTAGE_REGULAR_POOL
      );
    });
  });

  describe('Access control', () => {
    it('user should not be able to add pool', async () => {
      const swapFeeController = await deploySwapFeeController();
      await expect(
        swapFeeController.connect(other).setRegularPoolAllowance([ethers.utils.id('some pool')], [true])
      ).is.revertedWith('SENDER_NOT_ALLOWED');
    });

    it('authorizer can grant RegularPool permission to user', async () => {
      const swapFeeController = await deploySwapFeeController();
      const action = await actionId(swapFeeController, 'setRegularPoolAllowance(bytes32[],bool[])');
      await authorizer.connect(admin).grantPermissions([action], other.address, [ANY_ADDRESS]);
      const poolId = ethers.utils.id('some pool');
      await swapFeeController.connect(other).setRegularPoolAllowance([poolId], [true]);
      expect(await swapFeeController.isRegularPoolAllowed(poolId)).is.eq(true);
      expect(
        await swapFeeController.isAllowedSwapFeePercentage(poolId, DEFAULT_MIN_SWAP_FEE_PERCENTAGE_REGULAR_POOL)
      ).is.eq(true);
    });

    it('authorizer can grant StableExoticPool permission to user', async () => {
      const swapFeeController = await deploySwapFeeController();
      const action = await actionId(swapFeeController, 'setStableExoticPoolAllowance(bytes32[],bool[])');
      await authorizer.connect(admin).grantPermissions([action], other.address, [ANY_ADDRESS]);
      const poolId = ethers.utils.id('some pool');
      await swapFeeController.connect(other).setStableExoticPoolAllowance([poolId], [true]);
      expect(await swapFeeController.isStableExoticPoolAllowed(poolId)).is.eq(true);
      expect(
        await swapFeeController.isAllowedSwapFeePercentage(poolId, DEFAULT_MIN_SWAP_FEE_PERCENTAGE_REGULAR_POOL)
      ).is.eq(true);
      expect(
        await swapFeeController.isAllowedSwapFeePercentage(poolId, DEFAULT_MIN_SWAP_FEE_PERCENTAGE_STABLE_EX_POOL)
      ).is.eq(true);
    });

    it('authorizer can grant StableBlueChipsPool permission to user', async () => {
      const swapFeeController = await deploySwapFeeController();
      const action = await actionId(swapFeeController, 'setStableBlueChipsPoolAllowance(bytes32[],bool[])');
      await authorizer.connect(admin).grantPermissions([action], other.address, [ANY_ADDRESS]);
      const poolId = ethers.utils.id('some pool');
      await swapFeeController.connect(other).setStableBlueChipsPoolAllowance([poolId], [true]);
      expect(await swapFeeController.isStableBlueChipsPoolAllowed(poolId)).is.eq(true);
      expect(
        await swapFeeController.isAllowedSwapFeePercentage(poolId, DEFAULT_MIN_SWAP_FEE_PERCENTAGE_REGULAR_POOL)
      ).is.eq(true);
      expect(
        await swapFeeController.isAllowedSwapFeePercentage(poolId, DEFAULT_MIN_SWAP_FEE_PERCENTAGE_STABLE_EX_POOL)
      ).is.eq(true);
      expect(
        await swapFeeController.isAllowedSwapFeePercentage(poolId, DEFAULT_MIN_SWAP_FEE_PERCENTAGE_STABLE_BC_POOL)
      ).is.eq(true);
    });
  });
});

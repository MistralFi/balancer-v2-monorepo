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

describe('RelayedConverterBPT tests', function () {
  let tokens: TokenList,
    vault: Vault,
    tetuVault: Contract,
    relayer: Contract,
    liquidator: Contract,
    feeForwarder: Contract,
    gague: Contract,
    assetManager: Contract,
    converter: Contract,
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
    assetManagerImplementation = 'ERC4626AssetManager',
    tetuVaultFee = bn(0)
  ) => {
    [deployer, user, vaultFeeCollector] = await ethers.getSigners();

    feeForwarder = await deploy('v2-vault/MockForwarder', { args: [] });

    tokens = await TokenList.create(['DAI', 'MKR'], { sorted: true });
    rt = (await TokenList.create(['RT'])).RT;

    // Deploy Balancer Vault
    vault = await Vault.create();
    tetuVault = await deploy('Mock4626VaultV2', {
      args: [tokens.first.address, 'TetuT0', 'TetuT0', isReturnShares, isReturnTokens, vaultFeeCollector.address],
    });
    if (tetuVaultFee.toString() != bn(0).toString()) {
      await tetuVault.setFeeNom(tetuVaultFee);
    }

    gague = await deploy('MockGague', {
      args: [[rt.address], [gagueReturnAmount], tetuVault.address],
    });

    // Deploy Asset manager
    assetManager = await deploy(assetManagerImplementation, {
      args: [
        vault.address,
        tetuVault.address,
        tokens.DAI.address,
        feeForwarder.address,
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
    await pool.vault.instance.setRelayerApproval(deployer.address, pool.relayer.address, true);

    await pool.initRelayer({ recipient: deployer, initialBalances });
    relayer = pool.relayer;

    liquidator = await deploy('MockLiquidator');
    converter = await deploy('RelayedConverterBPT', {
      args: [deployer.address, liquidator.address, tokens.first.address, poolId, relayer.address],
    });
  };

  beforeEach('set up core contracts', async () => {
    await setup();
  });

  describe('General tests', function () {
    it('Smoke test', async function () {
      expect(await converter.owner()).is.eq(deployer.address);
      expect(await converter.liquidator()).is.eq(liquidator.address);
      expect(await converter.targetToken()).is.eq(tokens.first.address);
      expect(await converter.targetPoolId()).is.eq(poolId);
      expect(await converter.targetTokenThreshold()).is.eq(0);
      expect(await converter.relayer()).is.eq(relayer.address);
    });

    it('Convert test', async function () {
      const bptBefore = await pool.balanceOf(deployer.address);
      const amountToConvert = fp(1);
      // send tokens to converter
      await tokens.first.transfer(converter, amountToConvert);

      await converter.convert(tokens.first.address, amountToConvert, deployer.address);
      const bptAfter = await pool.balanceOf(deployer.address);
      expect(bptAfter).is.gt(bptBefore);
    });
  });
});

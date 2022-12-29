import { ethers } from 'hardhat';
import { Contract } from 'ethers';
import TokensDeployer from '@balancer-labs/v2-helpers/src/models/tokens/TokensDeployer';
import * as expectEvent from '@balancer-labs/v2-helpers/src/test/expectEvent';
import { actionId } from '@balancer-labs/v2-helpers/src/models/misc/actions';
import { deploy } from '@balancer-labs/v2-helpers/src/contract';
import { ZERO_ADDRESS, ANY_ADDRESS } from '@balancer-labs/v2-helpers/src/constants';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { MONTH } from '@balancer-labs/v2-helpers/src/time';
import { expect } from 'chai';
import { fp } from '@balancer-labs/v2-helpers/src/numbers';

describe('BaseInitializablePoolFactory', function () {
  const MOCK_FACTORY_CREATED_CONTRACT_CODE =
    '0x6101606040523480156200001257600080fd5b5060405162000cf638038062000cf68339810160408190526200003591620001f2565b8181604051806020016200004990620001e5565b601f1982820381018352601f90910116604052805183903090839060006002820460a081905280830360e081905281855290915083620000958162000106602090811b620003ae17901c565b60601b6001600160601b0319166080528285018051838252620000c48262000106602090811b620003ae17901c565b6001600160601b0319606091821b811660c05296909352905261010095909552505092821b831661012052509290921b90911661014052506200024692505050565b80517f602038038060206000396000f3fefefefefefefefefefefefefefefefefefefe808352600091602081018484f09084529150620001546001600160a01b03831615156101ac6200015a565b50919050565b816200016b576200016b816200016f565b5050565b62000181816210905360ea1b62000184565b50565b62461bcd60e51b600090815260206004526007602452600a808404818106603090810160081b958390069590950190829004918206850160101b01602363ffffff0060e086901c160160181b0190930160c81b60445260e882901c90606490fd5b605c8062000c9a83390190565b6000806040838503121562000205578182fd5b8251620002128162000230565b6020840151909250620002258162000230565b809150509250929050565b6001600160a01b03811681146200018157600080fd5b60805160601c60a05160c05160601c60e051610100516101205160601c6101405160601c6109ea620002b0600039806102755250806102eb52508061029b5250806104155250806101b75280610491525080610436525080610196528061046d52506109ea6000f3fe608060405234801561001057600080fd5b50600436106100bd5760003560e01c8063739238d6116100765780638d928af81161005b5780638d928af81461015d578063aaabadc514610165578063efc81a8c1461016d576100bd565b8063739238d614610128578063851c1bb31461013d576100bd565b80632f2770db116100a75780632f2770db146100f65780636634b753146101005780636c57f5a914610120576100bd565b8062c194db146100c2578063174481fa146100e0575b600080fd5b6100ca610175565b6040516100d79190610921565b60405180910390f35b6100e8610194565b6040516100d79291906108ba565b6100fe6101da565b005b61011361010e3660046107d1565b61023f565b6040516100d791906108e1565b61011361026a565b610130610273565b6040516100d79190610899565b61015061014b36600461080d565b610297565b6040516100d791906108ec565b6101306102e9565b61013061030d565b610130610394565b606061018f6040518060200160405280600081525061040d565b905090565b7f00000000000000000000000000000000000000000000000000000000000000007f00000000000000000000000000000000000000000000000000000000000000009091565b6101e26104e6565b6101ea61052f565b600180547fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0016811790556040517f432acbfd662dbb5d8b378384a67159b47ca9d0f1b79f97cf64cf8585fa362d5090600090a1565b73ffffffffffffffffffffffffffffffffffffffff1660009081526020819052604090205460ff1690565b60015460ff1690565b7f000000000000000000000000000000000000000000000000000000000000000090565b60007f0000000000000000000000000000000000000000000000000000000000000000826040516020016102cc929190610869565b604051602081830303815290604052805190602001209050919050565b7f000000000000000000000000000000000000000000000000000000000000000090565b60006103176102e9565b73ffffffffffffffffffffffffffffffffffffffff1663aaabadc56040518163ffffffff1660e01b815260040160206040518083038186803b15801561035c57600080fd5b505afa158015610370573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061018f919061084d565b600061018f60405180602001604052806000815250610544565b80517f602038038060206000396000f3fefefefefefefefefefefefefefefefefefefe808352600091602081018484f0908452915061040773ffffffffffffffffffffffffffffffffffffffff831615156101ac6105d8565b50919050565b8051604080517f00000000000000000000000000000000000000000000000000000000000000007f0000000000000000000000000000000000000000000000000000000000000000818101858101848101602090810190965280855293957f00000000000000000000000000000000000000000000000000000000000000009592947f000000000000000000000000000000000000000000000000000000000000000094938801866000828a3c846000888301883c50602089810190898501016104d88183866105ea565b505050505050505050919050565b60006105156000357fffffffff0000000000000000000000000000000000000000000000000000000016610297565b905061052c6105248233610664565b6101916105d8565b50565b61054261053a61026a565b1560d36105d8565b565b600061054e61052f565b600061055983610701565b73ffffffffffffffffffffffffffffffffffffffff811660008181526020819052604080822080547fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff001660011790555192935090917f83a48fbcfc991335314e74d0496aab6a1987e992ddc85dddbcc4d6dd6ef2e9fc9190a292915050565b816105e6576105e681610742565b5050565b5b602081106106285781518352602092830192909101907fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0016105eb565b905182516020929092036101000a7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0180199091169116179052565b600061066e61030d565b73ffffffffffffffffffffffffffffffffffffffff16639be2a8848484306040518463ffffffff1660e01b81526004016106aa939291906108f5565b60206040518083038186803b1580156106c257600080fd5b505afa1580156106d6573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906106fa91906107ed565b9392505050565b6000606061070e8361040d565b905060008151602083016000f0905073ffffffffffffffffffffffffffffffffffffffff81166106fa573d6000803e3d6000fd5b7f08c379a000000000000000000000000000000000000000000000000000000000600090815260206004526007602452600a808304818106603090810160081b83860601918390049283060160101b016642414c230000300160c81b60445261052c917f42414c0000000000000000000000000000000000000000000000000000000000906242414c90606490fd5b6000602082840312156107e2578081fd5b81356106fa81610992565b6000602082840312156107fe578081fd5b815180151581146106fa578182fd5b60006020828403121561081e578081fd5b81357fffffffff00000000000000000000000000000000000000000000000000000000811681146106fa578182fd5b60006020828403121561085e578081fd5b81516106fa81610992565b9182527fffffffff0000000000000000000000000000000000000000000000000000000016602082015260240190565b73ffffffffffffffffffffffffffffffffffffffff91909116815260200190565b73ffffffffffffffffffffffffffffffffffffffff92831681529116602082015260400190565b901515815260200190565b90815260200190565b92835273ffffffffffffffffffffffffffffffffffffffff918216602084015216604082015260600190565b6000602080835283518082850152825b8181101561094d57858101830151858201604001528201610931565b8181111561095e5783604083870101525b50601f017fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe016929092016040019392505050565b73ffffffffffffffffffffffffffffffffffffffff8116811461052c57600080fdfea26469706673582212208e0402a43c5a72911035f29314f60a61b34a7429fb06f3a9a3eb7983a29ca54b64736f6c634300070100336080604052348015600f57600080fd5b50603f80601d6000396000f3fe6080604052600080fdfea2646970667358221220cf5cc38ca1a2cb6d0707e37f50aef2a866edf3140c515450047a0d02cb3f492e64736f6c63430007010033000000000000000000000000cf7ed3acca5a467e9e704c703e8d87f634fb0fc9000000000000000000000000dc64a140aa3e981100a9beca4e685f962f0cf6c9';
  let vault: Contract;
  let factory: Contract;
  let authorizer: Contract;
  let admin: SignerWithAddress;
  let other: SignerWithAddress;
  let protocolFeesProvider: Contract;

  before('setup signers', async () => {
    [, admin, other] = await ethers.getSigners();
  });

  sharedBeforeEach(async () => {
    const WETH = await TokensDeployer.deployToken({ symbol: 'WETH' });

    authorizer = await deploy('v2-vault/TimelockAuthorizer', { args: [admin.address, ZERO_ADDRESS, MONTH] });
    const feeForwarder = await deploy('v2-vault/MockForwarder', { args: [] });
    vault = await deploy('v2-vault/Vault', {
      args: [authorizer.address, WETH.address, MONTH, MONTH, feeForwarder.address],
    });
    protocolFeesProvider = await deploy('v2-standalone-utils/ProtocolFeePercentagesProvider', {
      args: [vault.address, fp(1), fp(1)],
    });

    factory = await deploy('MockInitializablePoolFactory', { args: [vault.address, protocolFeesProvider.address] });
    await factory.init(MOCK_FACTORY_CREATED_CONTRACT_CODE);
    const action = await actionId(factory, 'disable');
    await authorizer.connect(admin).grantPermissions([action], admin.address, [ANY_ADDRESS]);
  });

  it('stores the vault address', async () => {
    expect(await factory.getVault()).to.equal(vault.address);
  });

  it('stores the fee provider address', async () => {
    expect(await factory.getProtocolFeePercentagesProvider()).to.equal(protocolFeesProvider.address);
  });

  it('emits an event', async () => {
    const receipt = await (await factory.create()).wait();
    expectEvent.inReceipt(receipt, 'PoolCreated');
  });

  context('with a created pool', () => {
    let pool: string;

    sharedBeforeEach('create pool', async () => {
      const receipt = await (await factory.create()).wait();
      const event = expectEvent.inReceipt(receipt, 'PoolCreated');

      pool = event.args.pool;
    });

    it('tracks pools created by the factory', async () => {
      expect(await factory.isPoolFromFactory(pool)).to.be.true;
    });

    it('does not track pools that were not created by the factory', async () => {
      expect(await factory.isPoolFromFactory(other.address)).to.be.false;
    });
  });

  describe('disable', () => {
    context('when enabled', () => {
      it('disabled should be false', async () => {
        expect(await factory.isDisabled()).to.be.false;
      });

      it('allows creation', async () => {
        await expect(factory.create()).to.not.be.reverted;
      });

      it('prevents non-admins from disabling', async () => {
        await expect(factory.connect(other).disable()).to.be.revertedWith('SENDER_NOT_ALLOWED');
      });
    });

    context('when disabled', () => {
      sharedBeforeEach('disable the factory', async () => {
        const receipt = await factory.connect(admin).disable();

        expectEvent.inReceipt(await receipt.wait(), 'FactoryDisabled');
      });

      it('disabled should be true', async () => {
        expect(await factory.isDisabled()).to.be.true;
      });

      it('should not allow creation', async () => {
        await expect(factory.create()).to.be.revertedWith('DISABLED');
      });

      it('should not allow disabling twice', async () => {
        await expect(factory.connect(admin).disable()).to.be.revertedWith('DISABLED');
      });
    });
  });
});

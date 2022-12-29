import { Contract } from 'ethers';

import * as expectEvent from '@balancer-labs/v2-helpers/src/test/expectEvent';
import { deploy, deployedAt, getArtifact } from '@balancer-labs/v2-helpers/src/contract';
import { expect } from 'chai';
import { ethers } from 'hardhat';

describe('BaseInitializableSplitCodeFactory', function () {
  let factory: Contract;

  const INVALID_ID = '0x0000000000000000000000000000000000000000000000000000000000000000';
  const id = '0x0123456789012345678901234567890123456789012345678901234567890123';
  const MOCK_FACTORY_CREATED_CONTRACT_CODE =
    '0x608060405234801561001057600080fd5b506040516101073803806101078339818101604052602081101561003357600080fd5b505180610075576040805162461bcd60e51b815260206004820152600b60248201526a1393d397d6915493d7d25160aa1b604482015290519081900360640190fd5b6000556081806100866000396000f3fe6080604052348015600f57600080fd5b506004361060285760003560e01c80635d1ca63114602d575b600080fd5b60336045565b60408051918252519081900360200190f35b6000549056fea2646970667358221220eca06c0dfcadf66e2ff7666215b20a60aa9fbf7220d750b51961298f6bc0e35c64736f6c63430007010033';

  sharedBeforeEach(async () => {
    factory = await deploy('MockInitializableSplitCodeFactory', { args: [] });
    await factory.init(MOCK_FACTORY_CREATED_CONTRACT_CODE);
  });

  it('returns the contract creation code storage addresses', async () => {
    const { contractA, contractB } = await factory.getCreationCodeContracts();

    const codeA = await ethers.provider.getCode(contractA);
    const codeB = await ethers.provider.getCode(contractB);

    const artifact = await getArtifact('MockFactoryCreatedContract');
    expect(codeA.concat(codeB.slice(2))).to.equal(artifact.bytecode); // Slice to remove the '0x' prefix
  });

  it('returns the contract creation code', async () => {
    const artifact = await getArtifact('MockFactoryCreatedContract');
    const poolCreationCode = await factory.getCreationCode();

    expect(poolCreationCode).to.equal(artifact.bytecode);
  });

  it('creates a contract', async () => {
    const receipt = await (await factory.create(id)).wait();
    expectEvent.inReceipt(receipt, 'ContractCreated');
  });

  context('when the creation reverts', () => {
    it('reverts and bubbles up revert reasons', async () => {
      await expect(factory.create(INVALID_ID)).to.be.revertedWith('NON_ZERO_ID');
    });
  });

  context('with a created pool', () => {
    let contract: string;

    sharedBeforeEach('create contract', async () => {
      const receipt = await (await factory.create(id)).wait();
      const event = expectEvent.inReceipt(receipt, 'ContractCreated');

      contract = event.args.destination;
    });

    it('deploys correct bytecode', async () => {
      const code = await ethers.provider.getCode(contract);
      const artifact = await getArtifact('MockFactoryCreatedContract');
      expect(code).to.equal(artifact.deployedBytecode);
    });

    it('passes constructor arguments correctly', async () => {
      const contractObject = await deployedAt('MockFactoryCreatedContract', contract);
      expect(await contractObject.getId()).to.equal(id);
    });
  });
});

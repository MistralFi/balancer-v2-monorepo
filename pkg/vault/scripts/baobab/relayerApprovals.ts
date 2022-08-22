import { ethers } from 'hardhat';
import { actionId } from '@balancer-labs/v2-helpers/src/models/misc/actions';

async function main() {
  const signer = (await ethers.getSigners())[0];
  console.log(`signer address: ${signer.address}`);
  const vaultAddress = '0x96D6795721B6ffDa88169D031b9FD4Dc26e29578';
  const relayerAddress = '0xFe41681f459984A7B3cEF3DFE0423Fd93f589EAC';
  const poolAddress = '0xcad73bdf12AE30dCAce312460D46C3C2d8667174';
  const vault = await ethers.getContractAt('Vault', vaultAddress);
  console.log(`vault: ${await vault.address}`);
  const authorizerAddr = await vault.getAuthorizer();
  const authorizer = await ethers.getContractAt('TimelockAuthorizer', authorizerAddr);
  console.log(`authorizer: ${await authorizer.address}`);
  const actionJoin = await actionId(vault, 'joinPool');
  const actionExit = await actionId(vault, 'exitPool');

  await authorizer.grantPermissions([actionJoin], relayerAddress, [vaultAddress]);
  await authorizer.grantPermissions([actionExit], relayerAddress, [vaultAddress]);
  const actionSetAssetManagerPoolConfig = '0x6018257480862333ca0e812eb8ce03d9f52a683c29810b31e91c375472e3b819';
  await authorizer.grantPermissions([actionSetAssetManagerPoolConfig], signer.address, [poolAddress]);

  await vault.setRelayerApproval(signer.address, relayerAddress, true);

  console.log(`Approvals granted`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

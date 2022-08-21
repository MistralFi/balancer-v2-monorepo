import { ethers } from 'hardhat';
import { actionId } from '@balancer-labs/v2-helpers/src/models/misc/actions';
import {ANY_ADDRESS} from "@balancer-labs/v2-helpers/src/constants";

async function main() {
  const signer = (await ethers.getSigners())[0];
  console.log(`signer address: ${signer.address}`);
  const vaultAddress = '0x96D6795721B6ffDa88169D031b9FD4Dc26e29578';
  const relayerAddress = '0xFe41681f459984A7B3cEF3DFE0423Fd93f589EAC';
  const poolAddress = '0x6A78e7262cAff2EF5E446A9E0A44631203A4424A';
  const pool = await ethers.getContractAt('IBasePool', poolAddress);
  console.log(`pool: ${await pool.address}`);
  const vault = await ethers.getContractAt('Vault', vaultAddress);
  console.log(`vault: ${await vault.address}`);
  const authorizerAddr = await vault.getAuthorizer();
  const authorizer = await ethers.getContractAt('TimelockAuthorizer', authorizerAddr);
  console.log(`authorizer: ${await authorizer.address}`);
  const actionJoin = await actionId(vault, 'joinPool');
  const actionExit = await actionId(vault, 'exitPool');
  const actionSetAssetManagerPoolConfig = await actionId(pool, 'setAssetManagerPoolConfig');

  await authorizer.grantPermissions([actionJoin], relayerAddress, [vaultAddress]);
  await authorizer.grantPermissions([actionExit], relayerAddress, [vaultAddress]);
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

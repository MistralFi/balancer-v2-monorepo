import { ethers } from 'hardhat';
import { actionId } from '@balancer-labs/v2-helpers/src/models/misc/actions';

async function main() {
  const signer = (await ethers.getSigners())[0];
  console.log(`signer address: ${signer.address}`);
  const poolAddress = '0xcad73bdf12AE30dCAce312460D46C3C2d8667174';
  const pool = await ethers.getContractAt('BasePool', poolAddress);
  const actionSetAssetManagerPoolConfig = await actionId(pool, 'setAssetManagerPoolConfig');
  console.log(`actionSetAssetManagerPoolConfig: ${actionSetAssetManagerPoolConfig}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

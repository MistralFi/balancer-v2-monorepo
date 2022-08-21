import { ethers } from 'hardhat';
import { actionId } from '@balancer-labs/v2-helpers/src/models/misc/actions';
import { bn, fp } from '@balancer-labs/v2-helpers/src/numbers';

async function main() {
  const signer = (await ethers.getSigners())[0];
  console.log(`signer address: ${signer.address}`);
  const amAddress = '0xE14918a2c7C5918d32244a06F16662583962d9c3';
  const poolAddress = '0x6A78e7262cAff2EF5E446A9E0A44631203A4424A';
  const am = await ethers.getContractAt('ERC4626AssetManager', amAddress);
  const pool = await ethers.getContractAt('IBasePool', poolAddress);
  const poolId = await pool.getPoolId();

  console.log(`getInvestmentConfig: ${await am.getInvestmentConfig(poolId)}`);

  console.log(`Done!`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

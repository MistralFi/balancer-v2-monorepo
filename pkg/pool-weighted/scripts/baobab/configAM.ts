import { ethers } from 'hardhat';
import { fp } from '@balancer-labs/v2-helpers/src/numbers';
import { encodeInvestmentConfig } from '@balancer-labs/v2-asset-manager-utils/test/helpers/rebalance';

async function main() {
  const signer = (await ethers.getSigners())[0];
  console.log(`signer address: ${signer.address}`);
  const amAddress = '0xE14918a2c7C5918d32244a06F16662583962d9c3';
  const poolAddress = '0x6A78e7262cAff2EF5E446A9E0A44631203A4424A';

  const pool = await ethers.getContractAt('BasePool', poolAddress);
  const poolId = await pool.getPoolId();
  const targetPercentage = fp(0.5);
  const upperCriticalPercentage = fp(0.6);
  const lowerCriticalPercentage = fp(0.35);
  const config = {
    targetPercentage: targetPercentage.div(2),
    upperCriticalPercentage: upperCriticalPercentage,
    lowerCriticalPercentage: lowerCriticalPercentage,
  };
  await pool.setAssetManagerPoolConfig('0x5413E7AFCADCB63A30Dad567f46dd146Cc427801', encodeInvestmentConfig(config));

  console.log(`Done!`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

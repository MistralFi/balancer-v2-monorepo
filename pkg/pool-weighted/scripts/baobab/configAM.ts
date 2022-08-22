import { ethers } from 'hardhat';
import { fp } from '@balancer-labs/v2-helpers/src/numbers';
import { encodeInvestmentConfig } from '@balancer-labs/v2-asset-manager-utils/test/helpers/rebalance';

async function main() {
  const signer = (await ethers.getSigners())[0];
  console.log(`signer address: ${signer.address}`);
  const poolAddress = '0xcad73bdf12AE30dCAce312460D46C3C2d8667174';

  const pool = await ethers.getContractAt('BasePool', poolAddress);
  const targetPercentage = fp(0.5);
  const upperCriticalPercentage = fp(0.6);
  const lowerCriticalPercentage = fp(0.35);
  const config = {
    targetPercentage: targetPercentage,
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

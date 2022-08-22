import { ethers } from 'hardhat';

async function main() {
  const signer = (await ethers.getSigners())[0];
  console.log(`signer address: ${signer.address}`);
  const amAddress = '0x44b519E878a2fC16c2005180f24c2ccEC9297b6b';
  const poolAddress = '0xcad73bdf12AE30dCAce312460D46C3C2d8667174';
  const am = await ethers.getContractAt('ERC4626AssetManager', amAddress);
  const pool = await ethers.getContractAt('IBasePool', poolAddress);
  const poolId = await pool.getPoolId();
  await am.initialize(poolId);
  console.log(`Done!`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

import { ethers } from 'hardhat';

async function main() {
  const signer = (await ethers.getSigners())[0];
  console.log(`signer address: ${signer.address}`);
  const amAddress = '0x44b519E878a2fC16c2005180f24c2ccEC9297b6b';
  const poolAddress = '0xcad73bdf12AE30dCAce312460D46C3C2d8667174';
  const tetuVaultAddress = '0x58DD880fcB81434f3546d380EC4507C01E9D09b2';

  const am = await ethers.getContractAt('ERC4626AssetManager', amAddress);
  const pool = await ethers.getContractAt('IBasePool', poolAddress);
  const tetuVault = await ethers.getContractAt('Mock4626VaultV2', tetuVaultAddress);
  console.log(`AM balance in tetuVault: ${await tetuVault.balanceOf(amAddress)}`);
  const poolId = await pool.getPoolId();
  console.log(`getInvestmentConfig: ${await am.getInvestmentConfig(poolId)}`);
  console.log(`maxInvestableBalance: ${await am.maxInvestableBalance(poolId)}`);
  console.log(`erc4626Vault: ${await am.erc4626Vault()}`);
  await am.rebalance(poolId, false);
  const poolBalances = await am.getPoolBalances(poolId);
  console.log(`poolBalances 0: ${poolBalances[0]}`);
  console.log(`poolBalances 1: ${poolBalances[1]}`);

  console.log(`Done!`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

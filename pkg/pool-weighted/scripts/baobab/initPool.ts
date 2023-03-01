import { ethers } from 'hardhat';
import { fp } from '@balancer-labs/v2-helpers/src/numbers';

async function main() {
  const signer = (await ethers.getSigners())[0];
  console.log(`signer address: ${signer.address}`);
  const poolAddress = '0xb5f97411fcf2598acb2d5da076e10b452843a5f2';
  const vaultAddress = '0x96D6795721B6ffDa88169D031b9FD4Dc26e29578';

  const pool = await ethers.getContractAt('IBasePool', poolAddress);
  const poolId = await pool.getPoolId();
  console.log(`poolId: ${poolId}`);
  const vault = await ethers.getContractAt('IVault', vaultAddress);
  const assets = [
    '0x4A79C8d130082A15CBE5cF1e7D07232e526DCe0D',
    '0x5413E7AFCADCB63A30Dad567f46dd146Cc427801',
    '0x86443DB7Fb8c6481849eACF278cfc699BD92F478',
  ];
  const initialBalances = [fp(5), fp(5), fp(10)];

  for (const i in assets) {
    const testToken = await ethers.getContractAt('IERC20', assets[i]);
    await testToken.approve(vaultAddress, initialBalances[i]);
  }

  const JOIN_KIND_INIT = 0;
  const initUserData = ethers.utils.defaultAbiCoder.encode(['uint256', 'uint256[]'], [JOIN_KIND_INIT, initialBalances]);
  const joinPoolRequest = {
    assets: assets,
    maxAmountsIn: initialBalances,
    userData: initUserData,
    fromInternalBalance: false,
  };
  await vault.joinPool(poolId, signer.address, signer.address, joinPoolRequest);
  console.log(`Done!`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

import { ethers } from 'hardhat';
import { fp } from '@balancer-labs/v2-helpers/src/numbers';

async function main() {
  const signer = (await ethers.getSigners())[0];
  console.log(`signer address: ${signer.address}`);
  const facrotyAddress = '0xC9C58BD6c6c1CAc12F8A174670BEC9e4C0924181';
  const WEIGHTS = [fp(0.25), fp(0.25), fp(0.5)];
  const TOKENS = [
    '0x4A79C8d130082A15CBE5cF1e7D07232e526DCe0D', //kdai
    '0x5413E7AFCADCB63A30Dad567f46dd146Cc427801', //usdc
    '0x86443DB7Fb8c6481849eACF278cfc699BD92F478', //mistral
  ];
  const POOL_SWAP_FEE_PERCENTAGE = fp(0.01);
  const factory = await ethers.getContractAt('InitializableWeightedPoolFactory', facrotyAddress);
  await factory.create(
    'Mistral-oUSDC-KDAI-wp',
    'Mistral-oUSDC-KDAI-wp',
    TOKENS,
    WEIGHTS,
    [ethers.constants.AddressZero, ethers.constants.AddressZero, ethers.constants.AddressZero], // no YieldFees
    POOL_SWAP_FEE_PERCENTAGE,
    signer.address
  );
  // pool address: 0xb5f97411fcf2598acb2d5da076e10b452843a5f2
  console.log(`Done!`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

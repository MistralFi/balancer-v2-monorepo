import { ethers } from 'hardhat';
import { fp } from '@balancer-labs/v2-helpers/src/numbers';

async function main() {
  const signer = (await ethers.getSigners())[0];
  console.log(`signer address: ${signer.address}`);
  const mistralToken = '0x86443DB7Fb8c6481849eACF278cfc699BD92F478';
  const usdcToken = '0x5413E7AFCADCB63A30Dad567f46dd146Cc427801';
  const usdtToken = '0x968FC3A1e120a2A6f26B50A7bB28962E7d5B716D';
  const kdaiToken = '0x4A79C8d130082A15CBE5cF1e7D07232e526DCe0D';
  const relayerAddress = '0xFe41681f459984A7B3cEF3DFE0423Fd93f589EAC';
  const tokens = [mistralToken, usdtToken, usdcToken, kdaiToken];
  for (const i in tokens) {
    const testToken = await ethers.getContractAt('TestToken', tokens[i]);
    await testToken.mint(signer.address, fp(1));
    const bal = await testToken.balanceOf(signer.address);
    console.log(`Balance: ${bal}`);
    await testToken.approve(relayerAddress, bal);
  }
  console.log(`Test tokens minted and relayer approved!`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

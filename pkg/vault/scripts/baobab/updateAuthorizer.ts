import { ethers } from 'hardhat';
import { actionId } from '@balancer-labs/v2-helpers/src/models/misc/actions';
import { ANY_ADDRESS } from '@balancer-labs/v2-helpers/src/constants';

async function main() {
  const signer = (await ethers.getSigners())[0];
  console.log(`signer address: ${signer.address}`);
  const vaultAddress = '0x96D6795721B6ffDa88169D031b9FD4Dc26e29578';
  const oldAuthorizerAddress = '0x7772E6FFa158a13205b63Fe1abE921F4bDD54a3d';
  const newAuthorizerAddress = '0x1476Ab41a45b81324dAd2A1E0B3a3281458ba502';

  const vault = await ethers.getContractAt('Vault', vaultAddress);
  const oldAuthorizer = await ethers.getContractAt('TimelockAuthorizer', oldAuthorizerAddress);
  const newAuthorizer = await ethers.getContractAt('TimelockAuthorizer', newAuthorizerAddress);

  const setAuthorizerAction = await actionId(vault, 'setAuthorizer');
  await oldAuthorizer.grantPermissions([setAuthorizerAction], signer.address, [ANY_ADDRESS]);
  await vault.setAuthorizer(newAuthorizer.address);
  console.log(`Authorizer updated!`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

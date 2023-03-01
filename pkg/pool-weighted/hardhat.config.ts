import '@nomiclabs/hardhat-ethers';
import '@nomiclabs/hardhat-waffle';

import { hardhatBaseConfig } from '@balancer-labs/v2-common';
import { name } from './package.json';

import { task } from 'hardhat/config';
import { TASK_COMPILE } from 'hardhat/builtin-tasks/task-names';
import overrideQueryFunctions from '@balancer-labs/v2-helpers/plugins/overrideQueryFunctions';
import 'hardhat-local-networks-config-plugin';

task(TASK_COMPILE).setAction(overrideQueryFunctions);

require('hardhat-contract-sizer');
export default {
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true,
    },
  },
  solidity: {
    compilers: hardhatBaseConfig.compilers,
    overrides: { ...hardhatBaseConfig.overrides(name) },
  },
};

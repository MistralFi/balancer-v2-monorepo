import Task, { TaskMode } from '../../../src/task';

export type MockVaultDeployment = {
  TestToken: string;
  name: string;
  symbol: string;
  isReturnShares: boolean;
  isReturnTokens: boolean;
  vaultFeeCollector: string;
};

const TestToken = new Task('20220812-test-usdc', TaskMode.READ_ONLY);

export default {
  baobab: {
    TestToken: TestToken,
    name: '4626-usdc-vault',
    symbol: '4626-USDC',
    isReturnShares: true,
    isReturnTokens: true,
    vaultFeeCollector: '0xaBa49c1098Cc0FA65bF2393822Ae8A350019f374',
  },
};

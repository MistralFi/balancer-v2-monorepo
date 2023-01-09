import Task, { TaskMode } from '../../../src/task';

export type TestAMDeployment = {
  Vault: string;
  Mock4626VaultV2: string;
  TestToken: string;
  MockForwarder: string;
  MockGague: string;
};

const usdcToken = new Task('20220812-test-usdc', TaskMode.READ_ONLY);
const balancerVault = new Task('20220811-vault', TaskMode.READ_ONLY);
const erc4626Vault = new Task('20220812-test-4626-vault', TaskMode.READ_ONLY);
const feeForwarder = new Task('20220811-test-fee-forwarder', TaskMode.READ_ONLY);
const gauge = new Task('20220812-test-gague', TaskMode.READ_ONLY);

export default {
  baobab: {
    Vault: balancerVault,
    Mock4626VaultV2: erc4626Vault,
    TestToken: usdcToken,
    MockForwarder: feeForwarder,
    MockGague: gauge,
  },
};

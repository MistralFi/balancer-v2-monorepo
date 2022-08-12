import Task, { TaskMode } from '../../../src/task';
import { fp } from '@balancer-labs/v2-helpers/src/numbers';

export type MockGagueDeployment = {
  TestToken: string;
  dummyRewardAmount: number;
  Mock4626VaultV2: string;
};

const TestToken = new Task('20220812-test-mistral', TaskMode.READ_ONLY);
const Mock4626VaultV2 = new Task('20220812-test-4626-vault', TaskMode.READ_ONLY);

export default {
  baobab: {
    TestToken: TestToken,
    dummyRewardAmount: fp(1),
    Mock4626VaultV2: Mock4626VaultV2,
  },
};

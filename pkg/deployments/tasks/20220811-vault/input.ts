import Task, { TaskMode } from '../../src/task';
import { MONTH, WEEK } from '@balancer-labs/v2-helpers/src/time';

export type VaultDeployment = {
  TimelockAuthorizer: string;
  weth: string;
  pauseWindowDuration: number;
  bufferPeriodDuration: number;
  MockForwarder: string;
};

const TimelockAuthorizer = new Task('20220810-timelock-authorizer', TaskMode.READ_ONLY);
const TestFeeForwarder = new Task('20220811-test-fee-forwarder', TaskMode.READ_ONLY);

export default {
  baobab: {
    TimelockAuthorizer: TimelockAuthorizer,
    weth: '0xa5244bf7c2708fff3b54501f5ef4dc81a9551097',
    pauseWindowDuration: MONTH,
    bufferPeriodDuration: WEEK,
    MockForwarder: TestFeeForwarder,
  },
};

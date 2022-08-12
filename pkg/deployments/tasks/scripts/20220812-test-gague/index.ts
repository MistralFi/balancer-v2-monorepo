import { MockGagueDeployment } from './input';
import Task from '../../../src/task';
import { TaskRunOptions } from '../../../src/types';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as MockGagueDeployment;
  const args = [[input.TestToken], [input.dummyRewardAmount], input.Mock4626VaultV2];
  await task.deploy('MockGague', args, from, force);
};

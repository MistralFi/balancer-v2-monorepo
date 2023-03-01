import Task from '../../../src/task';
import { TaskRunOptions } from '../../../src/types';
import { TestAMDeployment } from './input';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as TestAMDeployment;
  const args = [input.Vault, input.Mock4626VaultV2, input.TestToken, input.MockForwarder, input.MockGague];
  await task.deploy('ERC4626AssetManager', args, from, force);
};

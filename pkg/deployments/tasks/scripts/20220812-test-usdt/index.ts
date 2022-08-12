import Task from '../../../src/task';
import { TaskRunOptions } from '../../../src/types';
import { TestTokenDeployment } from './input';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as TestTokenDeployment;
  const args = [input.name, input.symbol, input.decimals];
  await task.deploy('TestToken', args, from, force);
};

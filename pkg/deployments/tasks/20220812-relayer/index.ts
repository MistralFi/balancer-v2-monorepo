import Task from '../../src/task';
import { RelayerDeployment } from './input';
import { TaskRunOptions } from '../../src/types';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as RelayerDeployment;
  const args = [input.Vault];
  await task.deploy('Relayer', args, from, force);
};

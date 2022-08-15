import Task from '../../src/task';
import { RelayedWeightedPoolFactoryDeployment } from './input';
import { TaskRunOptions } from '../../src/types';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as RelayedWeightedPoolFactoryDeployment;
  const vaultArgs = [input.Vault, input.Relayer, input.SwapFeeController];
  console.log(input.Vault);
  console.log(input.Relayer);
  console.log(input.SwapFeeController);
  await task.deploy('RelayedWeightedPoolFactory', vaultArgs, from, force);
};

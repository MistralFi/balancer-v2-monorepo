import { RelayedWeightedPoolDeployment } from './input';
import Task from '../../../src/task';
import { TaskRunOptions } from '../../../src/types';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as RelayedWeightedPoolDeployment;
  const args = [
    input.Vault,
    input.Name,
    input.Symbol,
    input.Tokens,
    input.NormalizedWeights,
    input.AssetManagers,
    input.SwapFeePercentage,
    input.PauseWindowDuration,
    input.PauseWindowDuration,
    input.Owner,
    input.Relayer,
  ];

  await task.deploy('RelayedWeightedPool', args, from, force);
};

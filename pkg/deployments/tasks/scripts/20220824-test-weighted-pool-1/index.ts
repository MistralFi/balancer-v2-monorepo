import { WeightedPoolDeployment } from './input';
import Task from '../../../src/task';
import { TaskRunOptions } from '../../../src/types';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as WeightedPoolDeployment;
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
  ];

  await task.deploy('WeightedPool', args, from, force);
};

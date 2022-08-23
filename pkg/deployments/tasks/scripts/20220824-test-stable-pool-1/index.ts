import { StablePoolDeployment} from './input';
import Task from '../../../src/task';
import { TaskRunOptions } from '../../../src/types';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as StablePoolDeployment;
  const args = [
    input.Vault,
    input.Name,
    input.Symbol,
    input.Tokens,
    input.AmplificationParameter,
    input.SwapFeePercentage,
    input.PauseWindowDuration,
    input.PauseWindowDuration,
    input.Owner,
  ];

  await task.deploy('StablePool', args, from, force);
};

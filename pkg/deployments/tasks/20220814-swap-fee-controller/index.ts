import Task from '../../src/task';
import { SwapFeeControllerDeployment } from './input';
import { TaskRunOptions } from '../../src/types';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as SwapFeeControllerDeployment;
  const vaultArgs = [
    input.Vault,
    input.maxSwapFeePercentage,
    input.minSwapFeePercentageStableBCPool,
    input.minSwapFeePercentageStableExoticPool,
    input.minSwapFeePercentageRegularPool,
  ];
  await task.deploy('SwapFeeController', vaultArgs, from, force);
};

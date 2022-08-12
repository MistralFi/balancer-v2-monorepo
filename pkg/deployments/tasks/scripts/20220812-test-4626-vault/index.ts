import { MockVaultDeployment } from './input';
import Task from '../../../src/task';
import { TaskRunOptions } from '../../../src/types';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as MockVaultDeployment;
  const args = [
    input.TestToken,
    input.name,
    input.symbol,
    input.isReturnShares,
    input.isReturnTokens,
    input.vaultFeeCollector,
  ];
  await task.deployAndVerify('Mock4626VaultV2', args, from, force);
};

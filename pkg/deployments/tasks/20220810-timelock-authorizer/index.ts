import Task from '../../src/task';
import { TaskRunOptions } from '../../src/types';
import { TimelockAuthorizerDeployment } from './input';

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as TimelockAuthorizerDeployment;
  const args = [input.admin, input.vault, input.rootTransferDelay];
  await task.deployAndVerify('TimelockAuthorizer', args, from, force);
};

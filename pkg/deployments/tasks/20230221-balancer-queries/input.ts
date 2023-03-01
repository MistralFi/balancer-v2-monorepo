import Task, { TaskMode } from '../../src/task';

export type BalancerQueriesDeployment = {
  Vault: string;
};

const Vault = new Task('20220811-vault', TaskMode.READ_ONLY);

export default {
  Vault,
};

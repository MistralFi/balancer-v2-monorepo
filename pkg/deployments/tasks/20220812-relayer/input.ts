import Task, { TaskMode } from '../../src/task';

export type RelayerDeployment = {
  Vault: string;
};

const Vault = new Task('20220811-vault', TaskMode.READ_ONLY);

export default {
  baobab: {
    Vault: Vault,
  },
};

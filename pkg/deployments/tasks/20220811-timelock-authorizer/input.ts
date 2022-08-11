import Task, { TaskMode } from '../../src/task';

export type TimelockAuthorizerDeployment = {
  admin: string;
  Vault: string;
  rootTransferDelay: string;
};

const Vault = new Task('20220811-vault', TaskMode.READ_ONLY);

export default {
  baobab: {
    admin: '0xaaa01Cb6C7570733aE3eDeD876a98C9Bc373803b',
    Vault: Vault,
    rootTransferDelay: '0',
  },
};

import Task, { TaskMode } from '../../src/task';

export type BatchRelayerDeployment = {
  Vault: string;
  wstETH: string;
  BalancerMinter: string;
};

const Vault = new Task('20220811-vault', TaskMode.READ_ONLY);

export default {
  Vault,
  baobab: {
    wstETH: '0x0000000000000000000000000000000000000000',
    BalancerMinter: '0x0000000000000000000000000000000000000000',
  },
};

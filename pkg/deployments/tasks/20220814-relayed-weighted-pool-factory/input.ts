import Task, { TaskMode } from '../../src/task';

export type RelayedWeightedPoolFactoryDeployment = {
  Vault: string;
  Relayer: string;
  SwapFeeController: string;
};

const vault = new Task('20220811-vault', TaskMode.READ_ONLY);
const relayer = new Task('20220812-relayer', TaskMode.READ_ONLY);
const swapFeeController = new Task('20220814-swap-fee-controller', TaskMode.READ_ONLY);

export default {
  baobab: {
    Vault: vault,
    Relayer: relayer,
    SwapFeeController: swapFeeController,
  },
};

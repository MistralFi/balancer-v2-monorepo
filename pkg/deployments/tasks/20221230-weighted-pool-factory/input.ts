import Task, { TaskMode } from '../../src/task';

export type WeightedPoolDeployment = {
  Vault: string;
  ProtocolFeePercentagesProvider: string;
};

const Vault = new Task('20220811-vault', TaskMode.READ_ONLY);
const ProtocolFeePercentagesProvider = new Task('20221226-protocol-fee-percentages-provider', TaskMode.READ_ONLY);

export default {
  baobab: {
    Vault: Vault,
    ProtocolFeePercentagesProvider: ProtocolFeePercentagesProvider,
  },
};

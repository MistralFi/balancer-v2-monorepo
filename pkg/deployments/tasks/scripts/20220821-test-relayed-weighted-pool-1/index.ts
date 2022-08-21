import { RelayedWeightedPoolDeployment } from './input';
import Task from '../../../src/task';
import { TaskRunOptions } from '../../../src/types';
import {fp} from "@balancer-labs/v2-helpers/src/numbers";
import {ZERO_ADDRESS} from "@balancer-labs/v2-helpers/src/constants";

export default async (task: Task, { force, from }: TaskRunOptions = {}): Promise<void> => {
  const input = task.input() as RelayedWeightedPoolDeployment;
  const args = [
    input.Vault,
    input.Name,
    input.Symbol,
    input.Tokens,
    input.NormalizedWeights,
    input.AssetManagers,
    input.SwapFeePercentage,
    input.PauseWindowDuration,
    input.PauseWindowDuration,
    input.Owner,
    input.Relayer,
  ];
  console.log(input.Vault);
  console.log(input.Tokens);
  console.log(input.NormalizedWeights);
  console.log(input.AssetManagers);
  console.log(input.SwapFeePercentage);
// await RelayedWeightedPool.deploy(
//     vaultAddress,
//     'a',
//     'A',
//     ['0x5413E7AFCADCB63A30Dad567f46dd146Cc427801', '0x86443DB7Fb8c6481849eACF278cfc699BD92F478'],
//     [fp(0.5), fp(0.5)],
//     [ZERO_ADDRESS, ZERO_ADDRESS],
//     fp(0.01),
//     0,
//     0,
//     '0xBA1BA1ba1BA1bA1bA1Ba1BA1ba1BA1bA1ba1ba1B',
//     relayerAddress
//   );

  await task.deploy('RelayedWeightedPool', args, from, force);
};

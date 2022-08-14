import Task, { TaskMode } from '../../src/task';
import { fp } from '@balancer-labs/v2-helpers/src/numbers';

export type SwapFeeControllerDeployment = {
  Vault: string;
  maxSwapFeePercentage: number;
  minSwapFeePercentageStableBCPool: number;
  minSwapFeePercentageStableExoticPool: number;
  minSwapFeePercentageRegularPool: number;
};

const Vault = new Task('20220811-vault', TaskMode.READ_ONLY);

export default {
  baobab: {
    Vault: Vault,
    maxSwapFeePercentage: fp(0.01),
    minSwapFeePercentageStableBCPool: fp(0.0001),
    minSwapFeePercentageStableExoticPool: fp(0.0004),
    minSwapFeePercentageRegularPool: fp(0.0025),
  },
};

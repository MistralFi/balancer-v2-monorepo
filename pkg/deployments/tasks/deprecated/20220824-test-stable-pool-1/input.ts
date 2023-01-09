import { fp } from '@balancer-labs/v2-helpers/src/numbers';
import Task, { TaskMode } from '../../../src/task';

export type StablePoolDeployment = {
  Vault: string;
  Name: string;
  Symbol: string;
  Tokens: string[];
  AmplificationParameter: number;
  SwapFeePercentage: number;
  PauseWindowDuration: number;
  BufferPeriodDuration: number;
  Owner: string;
};
const vault = new Task('20220811-vault', TaskMode.READ_ONLY);

const usdcToken = new Task('20220812-test-usdc', TaskMode.READ_ONLY);
const kdaiToken = new Task('20220812-test-kdai', TaskMode.READ_ONLY);
const usdtToken = new Task('20220812-test-usdt', TaskMode.READ_ONLY);

export default {
  baobab: {
    Vault: vault,
    Name: 'usdc-kdai-usdt',
    Symbol: 'usdc-kdai-usdt',
    Tokens: [
      kdaiToken.output({ ensure: true, network: 'baobab' }).TestToken,
      usdcToken.output({ ensure: true, network: 'baobab' }).TestToken,
      usdtToken.output({ ensure: true, network: 'baobab' }).TestToken,
    ],
    AmplificationParameter: 500,
    SwapFeePercentage: fp(0.01),
    PauseWindowDuration: 0,
    BufferPeriodDuration: 0,
    Owner: '0xBA1BA1ba1BA1bA1bA1Ba1BA1ba1BA1bA1ba1ba1B',
  },
};

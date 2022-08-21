import { fp } from '@balancer-labs/v2-helpers/src/numbers';
import { ZERO_ADDRESS } from '@balancer-labs/v2-helpers/src/constants';
import Task, { TaskMode } from '../../../src/task';

export type RelayedWeightedPoolDeployment = {
  Vault: string;
  Name: string;
  Symbol: string;
  Tokens: string[];
  NormalizedWeights: number[];
  AssetManagers: string[];
  SwapFeePercentage: number;
  PauseWindowDuration: number;
  BufferPeriodDuration: number;
  Owner: string;
  Relayer: string;
};

const vault = new Task('20220811-vault', TaskMode.READ_ONLY);
const relayer = new Task('20220812-relayer', TaskMode.READ_ONLY);

const usdcToken = new Task('20220812-test-usdc', TaskMode.READ_ONLY);
const mistralToken = new Task('20220812-test-mistral', TaskMode.READ_ONLY);
const usdtToken = new Task('20220812-test-usdt', TaskMode.READ_ONLY);
const kdaiToken = new Task('20220812-test-kdai', TaskMode.READ_ONLY);
const usdcAM = new Task('20220814-test-usdc-asset-manager', TaskMode.READ_ONLY);

export default {
  baobab: {
    Vault: vault,
    Name: 'Mistral-oUSDC-KDAI',
    Symbol: 'Mistral-oUSDC-KDAI',
    Tokens: [
      '0x4A79C8d130082A15CBE5cF1e7D07232e526DCe0D', //kdai
      '0x5413E7AFCADCB63A30Dad567f46dd146Cc427801', //usdc
      '0x86443DB7Fb8c6481849eACF278cfc699BD92F478', //mistral
    ],
    NormalizedWeights: [fp(0.25), fp(0.25), fp(0.5)],
    AssetManagers: [ZERO_ADDRESS, '0xE14918a2c7C5918d32244a06F16662583962d9c3', ZERO_ADDRESS],
    SwapFeePercentage: fp(0.01),
    PauseWindowDuration: 0,
    BufferPeriodDuration: 0,
    Owner: '0xBA1BA1ba1BA1bA1bA1Ba1BA1ba1BA1bA1ba1ba1B',
    Relayer: relayer,
  },
};

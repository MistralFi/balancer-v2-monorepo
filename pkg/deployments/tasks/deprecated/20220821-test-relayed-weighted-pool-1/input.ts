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
const kdaiToken = new Task('20220812-test-kdai', TaskMode.READ_ONLY);
const usdcAM = new Task('20220814-test-usdc-asset-manager', TaskMode.READ_ONLY);

export default {
  baobab: {
    Vault: vault,
    Name: 'Mistral-oUSDC-KDAI',
    Symbol: 'Mistral-oUSDC-KDAI',
    Tokens: [
      kdaiToken.output({ ensure: true, network: 'baobab' }).TestToken,
      usdcToken.output({ ensure: true, network: 'baobab' }).TestToken,
      mistralToken.output({ ensure: true, network: 'baobab' }).TestToken,
    ],
    NormalizedWeights: [fp(0.25), fp(0.25), fp(0.5)],
    AssetManagers: [ZERO_ADDRESS, usdcAM.output({ ensure: true, network: 'baobab' }).ERC4626AssetManager, ZERO_ADDRESS],
    SwapFeePercentage: fp(0.01),
    PauseWindowDuration: 0,
    BufferPeriodDuration: 0,
    Owner: '0xBA1BA1ba1BA1bA1bA1Ba1BA1ba1BA1bA1ba1ba1B',
    Relayer: relayer,
  },
};

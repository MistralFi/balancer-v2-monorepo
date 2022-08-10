import { ZERO_ADDRESS } from '@balancer-labs/v2-helpers/src/constants';

export type TimelockAuthorizerDeployment = {
  admin: string;
  vault: string;
  rootTransferDelay: string;
};

export default {
  baobab: {
    admin: '0xaaa01Cb6C7570733aE3eDeD876a98C9Bc373803b',
    vault: ZERO_ADDRESS,
    rootTransferDelay: '0',
  },
};

// SPDX-License-Identifier: GPL-3.0-or-later
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import "@balancer-labs/v2-interfaces/contracts/vault/IVault.sol";
import "@balancer-labs/v2-interfaces/contracts/vault/ISwapFeeController.sol";
import "@balancer-labs/v2-interfaces/contracts/pool-utils/IRelayer.sol";
import "@balancer-labs/v2-interfaces/contracts/pool-utils/IAssetManagerBase.sol";

import "@balancer-labs/v2-pool-utils/contracts/factories/BasePoolSplitCodeFactory.sol";
import "@balancer-labs/v2-pool-utils/contracts/factories/FactoryWidePauseWindow.sol";

import "./RelayedWeightedPool.sol";

contract RelayedWeightedPoolFactory is BasePoolSplitCodeFactory, FactoryWidePauseWindow {
    ISwapFeeController public immutable swapFeeController;
    IRelayer public immutable relayer;

    struct NewPoolParams {
        string name;
        string symbol;
        IERC20[] tokens;
        uint256[] normalizedWeights;
        address[] assetManagers;
        address owner;
    }

    constructor(
        IVault vault,
        IRelayer _relayer,
        ISwapFeeController _swapFeeController
    ) BasePoolSplitCodeFactory(vault, type(RelayedWeightedPool).creationCode) {
        swapFeeController = _swapFeeController;
        relayer = _relayer;
    }

    /**
     * @dev Deploys a new `ManagedPool`. The owner should be a managed pool controller, deployed by
     * another factory.
     */
    function create(NewPoolParams memory poolParams) external returns (address) {
        (uint256 pauseWindowDuration, uint256 bufferPeriodDuration) = getPauseConfiguration();

        RelayedWeightedPool pool = RelayedWeightedPool(
            _create(
                abi.encode(
                    RelayedWeightedPool.NewPoolParams({
                        vault: getVault(),
                        name: poolParams.name,
                        symbol: poolParams.symbol,
                        tokens: poolParams.tokens,
                        normalizedWeights: poolParams.normalizedWeights,
                        assetManagers: poolParams.assetManagers,
                        swapFeePercentage: swapFeeController.maxSwapFeePercentage(),
                        pauseWindowDuration: pauseWindowDuration,
                        bufferPeriodDuration: bufferPeriodDuration,
                        owner: poolParams.owner,
                        relayer: relayer,
                        swapFeeController: swapFeeController
                    })
                )
            )
        );
        _initializeAssetManagers(poolParams.assetManagers, pool.getPoolId());
        return address(pool);
    }

    function _initializeAssetManagers(address[] memory assetManagers, bytes32 poolId) internal {
        for (uint256 i; i < assetManagers.length; i++) {
            if (assetManagers[i] != address(0)) {
                IAssetManagerBase(assetManagers[i]).initialize(poolId);
            }
        }
    }
}

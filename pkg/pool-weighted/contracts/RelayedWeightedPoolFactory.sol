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

import "@balancer-labs/v2-pool-utils/contracts/factories/BasePoolSplitCodeFactory.sol";
import "@balancer-labs/v2-pool-utils/contracts/factories/FactoryWidePauseWindow.sol";
import "@balancer-labs/v2-interfaces/contracts/pool-utils/IRelayer.sol";
import "@balancer-labs/v2-interfaces/contracts/pool-utils/IAssetManagerBase.sol";

import "./RelayedWeightedPool.sol";

contract RelayedWeightedPoolFactory is BasePoolSplitCodeFactory, FactoryWidePauseWindow {
    // pool ownership should be delegated to the Mistral governance to avoid pool swap fee manipulations.
    address public constant DELEGATE_OWNER = 0xBA1BA1ba1BA1bA1bA1Ba1BA1ba1BA1bA1ba1ba1B;
    uint256 public constant DEFAULT_SWAP_FEE = 1e16;

    IRelayer public immutable relayer;

    constructor(IVault vault, IRelayer _relayer)
        BasePoolSplitCodeFactory(vault, type(RelayedWeightedPool).creationCode)
    {
        relayer = _relayer;
    }

    /**
     * @dev Deploys a new `RelayedWeightedPool`.
     */
    function create(
        string memory name,
        string memory symbol,
        IERC20[] memory tokens,
        uint256[] memory weights,
        address[] memory assetManagers
    ) external returns (address) {
        (uint256 pauseWindowDuration, uint256 bufferPeriodDuration) = getPauseConfiguration();

        RelayedWeightedPool pool = RelayedWeightedPool(
            _create(
                abi.encode(
                    getVault(),
                    name,
                    symbol,
                    tokens,
                    weights,
                    assetManagers,
                    DEFAULT_SWAP_FEE,
                    pauseWindowDuration,
                    bufferPeriodDuration,
                    DELEGATE_OWNER,
                    relayer
                )
            )
        );
        _initializeAssetManagers(assetManagers, pool.getPoolId());
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

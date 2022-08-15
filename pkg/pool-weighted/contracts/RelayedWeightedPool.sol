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

import "./WeightedPool.sol";
import "@balancer-labs/v2-interfaces/contracts/pool-utils/IRelayedBasePool.sol";
import "@balancer-labs/v2-interfaces/contracts/pool-weighted/WeightedPoolUserData.sol";

/// @title RelayedWeightedPool
/// @dev RelayedWeightedPool is a extension of standard Balancer's Weighted pool with restricted joinPool and exitPool
///      Those methods should be called by the Relayer only to allow usage of Asset managers (rebalancing logic)
contract RelayedWeightedPool is WeightedPool, IRelayedBasePool {
    using WeightedPoolUserData for bytes;

    IBasePoolRelayer internal immutable _relayer;

    modifier ensureRelayerCall(bytes32 poolId, bytes calldata userData) {
        _require(_relayer.hasCalledPool(poolId), Errors.BASE_POOL_RELAYER_NOT_CALLED);
        _;
    }

    // The constructor arguments are received in a struct to work around stack-too-deep issues
    struct NewPoolParams {
        IVault vault;
        string name;
        string symbol;
        IERC20[] tokens;
        uint256[] normalizedWeights;
        address[] assetManagers;
        uint256 swapFeePercentage;
        uint256 pauseWindowDuration;
        uint256 bufferPeriodDuration;
        address owner;
        IBasePoolRelayer relayer;
        ISwapFeeController swapFeeController;
    }

    constructor(NewPoolParams memory params)
        WeightedPool(
            params.vault,
            params.name,
            params.symbol,
            params.tokens,
            params.normalizedWeights,
            params.assetManagers,
            params.swapFeePercentage,
            params.pauseWindowDuration,
            params.bufferPeriodDuration,
            params.owner,
            params.swapFeeController
        )
    {
        _relayer = params.relayer;
    }

    /// @dev returns relayer attached to this pool
    function getRelayer() public view override returns (IBasePoolRelayer) {
        return _relayer;
    }

    /// @dev hook to restrict direct joinPool requests. Only Relayer can join this pool
    function onJoinPool(
        bytes32 poolId,
        address sender,
        address recipient,
        uint256[] memory balances,
        uint256 lastChangeBlock,
        uint256 protocolSwapFeePercentage,
        bytes calldata userData
    ) public virtual override ensureRelayerCall(poolId, userData) returns (uint256[] memory, uint256[] memory) {
        return
            super.onJoinPool(poolId, sender, recipient, balances, lastChangeBlock, protocolSwapFeePercentage, userData);
    }

    /// @dev hook to restrict direct exitPool requests. Only Relayer can exit from this pool
    function onExitPool(
        bytes32 poolId,
        address sender,
        address recipient,
        uint256[] memory balances,
        uint256 lastChangeBlock,
        uint256 protocolSwapFeePercentage,
        bytes calldata userData
    ) public virtual override ensureRelayerCall(poolId, userData) returns (uint256[] memory, uint256[] memory) {
        return
            super.onExitPool(poolId, sender, recipient, balances, lastChangeBlock, protocolSwapFeePercentage, userData);
    }
}

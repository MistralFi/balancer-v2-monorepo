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

import "@balancer-labs/v2-pool-utils/contracts/RelayedBasePool.sol";
import "./WeightedPool.sol";

/// @title RelayedWeightedPool
/// @dev RelayedWeightedPool is a extension of standard Balancer's Weighted pool with restricted joinPool and exitPool
///      Those methods should be called by the Relayer only to allow usage of Asset managers (rebalancing logic)
contract RelayedWeightedPool is WeightedPool, RelayedBasePool {
    constructor(
        WeightedPool.NewPoolParams memory params,
        IVault vault,
        IProtocolFeePercentagesProvider protocolFeeProvider,
        uint256 pauseWindowDuration,
        uint256 bufferPeriodDuration,
        address owner,
        IBasePoolRelayer relayer
    )
        WeightedPool(params, vault, protocolFeeProvider, pauseWindowDuration, bufferPeriodDuration, owner)
        RelayedBasePool(relayer)
    {}

    function _onDisableRecoveryMode() internal override(WeightedPool, BasePool) {
        super._onDisableRecoveryMode();
    }
}

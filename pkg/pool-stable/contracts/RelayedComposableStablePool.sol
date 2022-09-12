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
import "./ComposableStablePool.sol";

/// @title RelayedComposableStablePool
/// @dev RelayedComposableStablePool is a extension of standard Balancer's ComposableStable pool with restricted joinPool and exitPool
///      Those methods should be called by the Relayer only to allow usage of Asset managers (rebalancing logic)
contract RelayedComposableStablePool is ComposableStablePool, RelayedBasePool {
    constructor(ComposableStablePool.NewPoolParams memory params, IBasePoolRelayer relayer)
        ComposableStablePool(params)
        RelayedBasePool(relayer)
    {}

    function _isOwnerOnlyAction(bytes32 actionId)
        internal
        view
        override(ComposableStablePool, BasePool)
        returns (bool)
    {
        return super._isOwnerOnlyAction(actionId);
    }

    function _doRecoveryModeExit(
        uint256[] memory registeredBalances,
        uint256 totalSupply,
        bytes memory userData
    ) internal virtual override(ComposableStablePool, RecoveryMode) returns (uint256, uint256[] memory) {
        return super._doRecoveryModeExit(registeredBalances, totalSupply, userData);
    }

    function _beforeSwapJoinExit() internal override(ComposableStablePool, BasePool) {
        super._beforeSwapJoinExit();
    }
}

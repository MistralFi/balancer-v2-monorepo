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

import "@balancer-labs/v2-interfaces/contracts/vault/IForwardableProtocolFeesCollector.sol";
import "./ProtocolFeesCollector.sol";

/**
 * @dev This an auxiliary contract to the Vault, deployed by it during construction. It offloads some of the tasks the
 * Vault performs to reduce its overall bytecode size.
 *
 * The current values for all protocol fee percentages are stored here, and any tokens charged as protocol fees are
 * sent to this contract, where they may be withdrawn by authorized entities. All authorization tasks are delegated
 * to the Vault's own authorizer.
 */
contract ForwardableProtocolFeesCollector is IForwardableProtocolFeesCollector, ProtocolFeesCollector {
    using SafeERC20 for IERC20;
    IForwarder public immutable feeForwarder;

    constructor(IVault _vault, IForwarder _feeForwarder) ProtocolFeesCollector(_vault) {
        require(address(_feeForwarder) != address(0), "FeeForwarder should be specified");
        feeForwarder = _feeForwarder;
    }

    function forwardFee(
        address poolAddress,
        IERC20 token,
        uint256 amount
    ) external override {
        require(msg.sender == address(vault), "Only vault can forward fees");
        require(token.balanceOf(address(this)) >= amount, "Insufficient balance");
        if (amount > 0) {
            token.safeTransfer(address(feeForwarder), amount);
            address[] memory tokens = new address[](1);
            tokens[0] = address(token);
            feeForwarder.registerIncome(tokens, poolAddress);
        }
    }
}

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

import "../Relayer.sol";
import "@balancer-labs/v2-interfaces/contracts/pool-stable/StablePoolUserData.sol";
import "@balancer-labs/v2-solidity-utils/contracts/helpers/ERC20Helpers.sol";
import "hardhat/console.sol";

/// @dev this contract used to test join request from contract
contract TestRelayerJoiner {
    /// @dev We will convert all tokens to target token and deposit to targetPool
    address public immutable targetToken;
    /// @dev Target balancer pool ID //clap3pool
    bytes32 public immutable targetPoolId;
    /// @dev Relayer contract used instead of vault for relayed pools for exchange tokens to BPT.
    address payable public immutable relayer;

    constructor(
        address _targetToken,
        bytes32 _targetPoolId,
        address payable _relayer
    ) {
        targetToken = _targetToken;
        targetPoolId = _targetPoolId;
        relayer = _relayer;
        (Relayer(_relayer).vault()).setRelayerApproval(address(this), _relayer, true);
        IERC20(_targetToken).approve(address(Relayer(_relayer).vault()), type(uint256).max);
    }

    function convertToBPT(address inToken) external {
        uint256 amountIn = 1e17;
        uint256 minimumBPT = 0;

        (IERC20[] memory tokens, , ) = (Relayer(relayer).vault()).getPoolTokens(targetPoolId);

        uint256[] memory _amounts = new uint256[](tokens.length);

        for (uint256 i = 0; i < tokens.length; i++) {
            if (address(tokens[i]) == inToken) {
                _amounts[i] = amountIn;
                break;
            }
        }

        bytes memory userData = abi.encode(
            StablePoolUserData.JoinKind.EXACT_TOKENS_IN_FOR_BPT_OUT,
            _amounts,
            minimumBPT
        );

        IVault.JoinPoolRequest memory request = IVault.JoinPoolRequest(_asIAsset(tokens), _amounts, userData, false);
        Relayer(relayer).joinPool(targetPoolId, address(this), request);
    }
}

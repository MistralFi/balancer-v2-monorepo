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

import "./IVault.sol";
import "./IAuthorizer.sol";

interface ISwapFeeController {

    event MaxSwapFeePercentageUpdated(uint256 maxSwapFeePercentage);
    event MinSwapFeePercentageStableBCPoolUpdated(uint256 minSwapFeePercentageStableBCPool);
    event MinSwapFeePercentageStableExoticPoolUpdated(uint256 minSwapFeePercentageStableExoticPool);
    event MinSwapFeePercentageRegularPoolUpdated(uint256 minSwapFeePercentageRegularPool);

    event RegularPoolUpdated(bytes32 poolId, bool isAllow);
    event StableExoticPoolUpdated(bytes32 poolId, bool isAllow);
    event StableBlueChipsPoolUpdated(bytes32 poolId, bool isAllow);

    /**
     * @notice Return true if swapFeePercentage is allowed for the given pool .
     */
    function isAllowedSwapFeePercentage(bytes32 poolId, uint256 swapFeePercentage) external view returns (bool);

    function getAuthorizer() external view returns (IAuthorizer);

    function vault() external view returns (IVault);

}

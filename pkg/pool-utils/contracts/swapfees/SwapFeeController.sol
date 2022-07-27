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
import "@balancer-labs/v2-solidity-utils/contracts/helpers/Authentication.sol";

/**
 * @dev SwapFeeController is a separate contract which encapsulates protocol strategy regarding swap fees.
 */
contract SwapFeeController is ISwapFeeController, Authentication {
    // 1e18 corresponds to 1.0, or a 100% fee
    uint256 private constant _MIN_SWAP_FEE_PERCENTAGE = 1e14; // 0.01%
    uint256 private constant _MAX_SWAP_FEE_PERCENTAGE = 1e16; // 1% - this fits in 64 bits

    IVault public immutable override vault;

    uint256 public maxSwapFeePercentage;
    uint256 public minSwapFeePercentageStableBCPool;
    uint256 public minSwapFeePercentageStableExoticPool;
    uint256 public minSwapFeePercentageRegularPool;

    mapping(bytes32 => bool) private _stableBlueChipsPools;
    mapping(bytes32 => bool) private _stableExoticPools;
    mapping(bytes32 => bool) private _regularPools;

    constructor(
        IVault _vault,
        uint256 _maxSwapFeePercentage,
        uint256 _minSwapFeePercentageStableBCPool,
        uint256 _minSwapFeePercentageStableExoticPool,
        uint256 _minSwapFeePercentageRegularPool
    ) Authentication(bytes32(uint256(address(this)))) {
        require(address(_vault) != address(0), "Vault can't be empty");
        _checkFeeBoundaries(_maxSwapFeePercentage);
        _checkFeeBoundaries(_minSwapFeePercentageStableBCPool);
        _checkFeeBoundaries(_minSwapFeePercentageStableExoticPool);
        _checkFeeBoundaries(_minSwapFeePercentageRegularPool);

        vault = _vault;
        maxSwapFeePercentage = _maxSwapFeePercentage;
        minSwapFeePercentageStableBCPool = _minSwapFeePercentageStableBCPool;
        minSwapFeePercentageStableExoticPool = _minSwapFeePercentageStableExoticPool;
        minSwapFeePercentageRegularPool = _minSwapFeePercentageRegularPool;

        emit MaxSwapFeePercentageUpdated(maxSwapFeePercentage);
        emit MinSwapFeePercentageStableBCPoolUpdated(minSwapFeePercentageStableBCPool);
        emit MinSwapFeePercentageStableExoticPoolUpdated(minSwapFeePercentageStableExoticPool);
        emit MinSwapFeePercentageRegularPoolUpdated(minSwapFeePercentageRegularPool);
    }

    function _checkFeeBoundaries(uint256 fee) private pure {
        require(fee <= _MAX_SWAP_FEE_PERCENTAGE, "Fee should be within boundaries (big)");
        require(fee >= _MIN_SWAP_FEE_PERCENTAGE, "Fee should be within boundaries (small)");
    }

    function setRegularPoolAllowance(bytes32 poolId, bool isAllow) external authenticate {
        _regularPools[poolId] = isAllow;
        emit RegularPoolUpdated(poolId, isAllow);
    }

    function setStableExoticPoolAllowance(bytes32 poolId, bool isAllow) external authenticate {
        _stableExoticPools[poolId] = isAllow;
        emit StableExoticPoolUpdated(poolId, isAllow);
    }

    function setStableBlueChipsPoolAllowance(bytes32 poolId, bool isAllow) external authenticate {
        _stableBlueChipsPools[poolId] = isAllow;
        emit StableBlueChipsPoolUpdated(poolId, isAllow);
    }

    function isRegularPoolAllowed(bytes32 poolId) external view returns (bool) {
        return _regularPools[poolId];
    }

    function isStableBlueChipsPoolAllowed(bytes32 poolId) external view returns (bool) {
        return _stableBlueChipsPools[poolId];
    }

    function isStableExoticPoolAllowed(bytes32 poolId) external view returns (bool) {
        return _stableExoticPools[poolId];
    }

    function isAllowedSwapFeePercentage(bytes32 poolId, uint256 swapFeePercentage) public view override returns (bool) {
        if (_stableBlueChipsPools[poolId] && swapFeePercentage >= minSwapFeePercentageStableBCPool) {
            return true;
        } else if (_stableExoticPools[poolId] && swapFeePercentage >= minSwapFeePercentageStableExoticPool) {
            return true;
        } else if (_regularPools[poolId] && swapFeePercentage >= minSwapFeePercentageRegularPool) {
            return true;
        } else if (swapFeePercentage == maxSwapFeePercentage) {
            return true;
        }
        return false;
    }

    function getAuthorizer() external view override returns (IAuthorizer) {
        return _getAuthorizer();
    }

    function _canPerform(bytes32 actionId, address account) internal view override returns (bool) {
        return _getAuthorizer().canPerform(actionId, account, address(this));
    }

    function _getAuthorizer() internal view returns (IAuthorizer) {
        return vault.getAuthorizer();
    }
}

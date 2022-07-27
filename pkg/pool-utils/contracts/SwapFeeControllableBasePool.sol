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

import "@balancer-labs/v2-interfaces/contracts/vault/ISwapFeeControllablePool.sol";
import "@balancer-labs/v2-interfaces/contracts/vault/ISwapFeeController.sol";
import "./BasePool.sol";

import "hardhat/console.sol";

abstract contract SwapFeeControllableBasePool is ISwapFeeControllablePool, BasePool{

    uint256 private constant _DEFAULT_SWAP_FEE_PERCENTAGE = 1e16; // 1% - this fits in 64 bits
    uint256 private _current_swap_fee_percentage;

    ISwapFeeController public swapFeeController;


    constructor(
        IVault vault,
        IVault.PoolSpecialization specialization,
        string memory name,
        string memory symbol,
        IERC20[] memory tokens,
        address[] memory assetManagers,
        uint256 swapFeePercentage,
        uint256 pauseWindowDuration,
        uint256 bufferPeriodDuration,
        address owner,
        ISwapFeeController _swapFeeController
    ) BasePool(vault, specialization, name, symbol, tokens, assetManagers, swapFeePercentage, pauseWindowDuration, bufferPeriodDuration, owner){
        // requier
        swapFeeController = _swapFeeController;
    }

    function getSwapFeeController() external view override returns(address){
        return address(swapFeeController);
    }

    function _getMinSwapFeePercentage() internal view virtual override returns (uint256) {
        if(_current_swap_fee_percentage !=0 ){
            return _current_swap_fee_percentage;
        }
        return _DEFAULT_SWAP_FEE_PERCENTAGE;
    }

    function _getMaxSwapFeePercentage() internal view virtual override returns (uint256) {
        if(_current_swap_fee_percentage != 0){
            return _current_swap_fee_percentage;
        }
        return _DEFAULT_SWAP_FEE_PERCENTAGE;
    }

    /**
     * @notice Set the swap fee percentage.
     * @dev This is a permissioned function, and disabled if the pool is paused. The swap fee must be within values allowed by ISwapFeeController.
      Emits the SwapFeePercentageChanged event.
     */
    function setSwapFeePercentage(uint256 swapFeePercentage) public virtual override authenticate whenNotPaused {
        _require(swapFeeController.isAllowedSwapFeePercentage(getPoolId(), swapFeePercentage), Errors.SWAP_FEE_DISALLOWED_BY_FEE_CONTROLLER);
        _current_swap_fee_percentage = swapFeePercentage;
        _setSwapFeePercentage(swapFeePercentage);
    }
}

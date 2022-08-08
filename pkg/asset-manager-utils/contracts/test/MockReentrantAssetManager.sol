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

pragma experimental ABIEncoderV2;
pragma solidity ^0.7.0;

import "../AssetManagerBase.sol";
import "./interfaces/IRelayer.sol";

contract MockReentrantAssetManager is IAssetManagerBase {
    address public underlying;
    InvestmentConfig private _config;

    constructor(
        address,
        address,
        address _underlying,
        address,
        address
    ) {
        underlying = _underlying;
    }

    function initialize(bytes32) external override {}

    function setConfig(bytes32, bytes calldata) external override {}

    function getInvestmentConfig(bytes32) external view override returns (InvestmentConfig memory) {
        return _config;
    }

    function getToken() external view override returns (IERC20) {
        return IERC20(underlying);
    }

    function getAUM(bytes32) external pure override returns (uint256) {
        return 42;
    }

    function getPoolBalances(bytes32) external pure override returns (uint256 poolCash, uint256 poolManaged) {
        return (1, 2);
    }

    function maxInvestableBalance(bytes32) external pure override returns (int256) {
        return 42;
    }

    function updateBalanceOfPool(bytes32) external override {}

    function shouldRebalance(uint256, uint256) external pure override returns (bool) {
        return true;
    }

    function rebalance(bytes32 poolId, bool) external override {
        IAsset[] memory _assets = new IAsset[](2);
        _assets[0] = IAsset(underlying);
        uint256[] memory _amounts = new uint256[](2);
        // reentrancy call
        IVault.JoinPoolRequest memory request = IVault.JoinPoolRequest({
            assets: _assets,
            maxAmountsIn: _amounts,
            userData: "",
            fromInternalBalance: false
        });
        IRelayer(msg.sender).joinPool(poolId, address(0), request);
    }

    function capitalOut(bytes32, uint256) external override {}

    function claimRewards() external override {}
}

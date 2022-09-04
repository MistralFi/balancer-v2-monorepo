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

import "@balancer-labs/v2-solidity-utils/contracts/openzeppelin/ERC20.sol";
import "@balancer-labs/v2-interfaces/contracts/pool-utils/ILiquidator.sol";

contract MockLiquidator is ILiquidator {
    uint256 _price = 100_000 * 1e18;
    string _error = "";
    uint256 _routeLength = 1;

    function setPrice(uint256 value) external {
        _price = value;
    }

    function setError(string memory value) external {
        _error = value;
    }

    function setRouteLength(uint256 value) external {
        _routeLength = value;
    }

    function getPrice(
        address,
        address,
        uint256
    ) external view override returns (uint256) {
        return _price;
    }

    function getPriceForRoute(PoolData[] memory, uint256) external view override returns (uint256) {
        return _price;
    }

    function isRouteExist(address, address) external pure override returns (bool) {
        return true;
    }

    function buildRoute(address tokenIn, address tokenOut)
        external
        view
        override
        returns (PoolData[] memory route, string memory errorMessage)
    {
        if (_routeLength == 1) {
            route = new PoolData[](1);
            route[0].tokenIn = tokenIn;
            route[0].tokenOut = tokenOut;
        } else {
            route = new PoolData[](0);
        }
        return (route, _error);
    }

    function liquidate(
        address,
        address tokenOut,
        uint256 amount,
        uint256
    ) external override {
        IERC20(tokenOut).transfer(msg.sender, amount);
    }

    function liquidateWithRoute(
        PoolData[] memory route,
        uint256 amount,
        uint256
    ) external override {
        IERC20(route[0].tokenIn).transferFrom(msg.sender, address(this), amount);
        IERC20(route[route.length - 1].tokenOut).transfer(msg.sender, amount);
    }
}

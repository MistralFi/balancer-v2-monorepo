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

interface ILiquidator {
    struct PoolData {
        address pool;
        address swapper;
        address tokenIn;
        address tokenOut;
    }

    function getPrice(
        address tokenIn,
        address tokenOut,
        uint256 amount
    ) external view returns (uint256);

    function getPriceForRoute(PoolData[] memory route, uint256 amount) external view returns (uint256);

    function isRouteExist(address tokenIn, address tokenOut) external view returns (bool);

    function buildRoute(address tokenIn, address tokenOut)
        external
        view
        returns (PoolData[] memory route, string memory errorMessage);

    function liquidate(
        address tokenIn,
        address tokenOut,
        uint256 amount,
        uint256 slippage
    ) external;

    function liquidateWithRoute(
        PoolData[] memory route,
        uint256 amount,
        uint256 slippage
    ) external;
}

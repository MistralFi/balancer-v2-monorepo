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

interface IERC4626 {

  event Deposit(address indexed caller, address indexed owner, uint assets, uint shares);

  event Withdraw(
    address indexed caller,
    address indexed receiver,
    address indexed owner,
    uint assets,
    uint shares
  );


  function deposit(uint assets, address receiver) external returns (uint shares);

  function mint(uint shares, address receiver) external returns (uint assets);

  function withdraw(
    uint assets,
    address receiver,
    address owner
  ) external returns (uint shares);

  function redeem(
    uint shares,
    address receiver,
    address owner
  ) external returns (uint assets);

  function totalAssets() external view returns (uint);

  function convertToShares(uint assets) external view returns (uint);

  function convertToAssets(uint shares) external view returns (uint);

  function previewDeposit(uint assets) external view returns (uint);

  function previewMint(uint shares) external view returns (uint);

  function previewWithdraw(uint assets) external view returns (uint);

  function previewRedeem(uint shares) external view returns (uint);

  function maxDeposit(address) external view returns (uint);

  function maxMint(address) external view returns (uint);

  function maxWithdraw(address owner) external view returns (uint);

  function maxRedeem(address owner) external view returns (uint);

}

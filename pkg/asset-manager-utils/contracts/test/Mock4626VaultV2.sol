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
import "@balancer-labs/v2-solidity-utils/contracts/openzeppelin/SafeERC20.sol";
import "@balancer-labs/v2-interfaces/contracts/pool-utils/IERC4626.sol";
import "@balancer-labs/v2-solidity-utils/contracts/math/Math.sol";

contract Mock4626VaultV2 is IERC4626, ERC20 {
    using Math for uint256;
    using SafeERC20 for IERC20;

    IERC20 public asset;
    bool isReturnTokens;
    bool isReturnShares;
    uint256 constant feeDen = 100;
    uint256 feeNom = 0;
    address public vaultFeeCollector;

    constructor(
        address _asset,
        string memory _name,
        string memory _symbol,
        bool _isReturnShares,
        bool _isReturnTokens,
        address _vaultFeeCollector
    ) ERC20(_name, _symbol) {
        isReturnShares = _isReturnShares;
        isReturnTokens = _isReturnTokens;
        asset = IERC20(_asset);
        vaultFeeCollector = _vaultFeeCollector;
    }

    function setFeeNom(uint256 _feeNom) external {
        feeNom = _feeNom;
    }

    function deposit(uint256 assets, address receiver) external override returns (uint256 shares) {
        uint256 fee = assets.mul(feeNom).divDown(feeDen);

        asset.safeTransferFrom(msg.sender, address(this), assets.sub(fee));
        // fee simulation
        asset.safeTransferFrom(msg.sender, vaultFeeCollector, fee);

        if (isReturnShares) {
            _mint(receiver, assets);
        }
        return assets;
    }

    function mint(uint256 shares, address receiver) external override returns (uint256 assets) {
        asset.safeTransferFrom(msg.sender, address(this), assets);
        if (isReturnShares) {
            _mint(receiver, assets);
        }
        return shares;
    }

    function withdraw(
        uint256 assets,
        address receiver,
        address owner
    ) external override returns (uint256 shares) {
        _burn(owner, assets);
        if (isReturnTokens) {
            asset.safeTransfer(receiver, assets);
        }
        return assets;
    }

    function redeem(
        uint256 shares,
        address receiver,
        address owner
    ) external override returns (uint256 assets) {
        _burn(owner, shares);
        if (isReturnTokens) {
            asset.safeTransfer(receiver, shares);
        }
        return shares;
    }

    function totalAssets() public view override returns (uint256) {
        return asset.balanceOf(address(this));
    }

    function convertToShares(uint256 assets) external pure override returns (uint256) {
        return assets;
    }

    function convertToAssets(uint256 shares) external view override returns (uint256) {
        return totalSupply() == 0 ? shares : (shares.mul(totalAssets())).divDown(totalSupply());
    }

    function previewDeposit(uint256 assets) external pure override returns (uint256) {
        return assets;
    }

    function previewMint(uint256 shares) external pure override returns (uint256) {
        return shares;
    }

    function previewWithdraw(uint256 assets) external pure override returns (uint256) {
        return assets;
    }

    function previewRedeem(uint256 shares) external pure override returns (uint256) {
        return shares;
    }

    function maxDeposit(address) external pure override returns (uint256) {
        return 1e18;
    }

    function maxMint(address) external pure override returns (uint256) {
        return 1e18;
    }

    function maxWithdraw(address owner) external view override returns (uint256) {
        return balanceOf(owner);
    }

    function maxRedeem(address owner) external view override returns (uint256) {
        return balanceOf(owner);
    }
}

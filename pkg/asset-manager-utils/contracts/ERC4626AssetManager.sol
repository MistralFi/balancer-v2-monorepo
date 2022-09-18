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
import "@balancer-labs/v2-interfaces/contracts/pool-utils/IGauge.sol";
import "@balancer-labs/v2-interfaces/contracts/pool-utils/IERC4626.sol";
import "@balancer-labs/v2-interfaces/contracts/vault/IForwarder.sol";
import "./AssetManagerBase.sol";

/// @title ERC4626AssetManager
/// @dev ERC4626AssetManager can invest funds to ERC4626 vault and collect the rewards from gauge.
///      Currently configured to work with TetuVaultV2.
contract ERC4626AssetManager is AssetManagerBase {
    using SafeERC20 for IERC20;
    using Math for uint256;

    // ***************************************************
    //                VARIABLES
    // ***************************************************

    address public immutable erc4626Vault;

    /// @notice rewards from gauge are transferred to this address
    IForwarder public immutable feeForwarder;
    IGauge public immutable gauge;

    // ***************************************************
    //                  EVENTS
    // ***************************************************

    event Invested(uint256 amount);
    event Devested(uint256 amount);
    event RewardClaimed(address token, uint256 amount);

    // ***************************************************
    //                CONSTRUCTOR
    // ***************************************************

    constructor(
        IVault balancerVault_,
        address erc4626Vault_,
        address underlying_,
        IForwarder feeForwarder_,
        address gauge_
    ) AssetManagerBase(balancerVault_, IERC20(underlying_)) {
        require(erc4626Vault_ != address(0), "zero ERC4626 vault");
        require(address(feeForwarder_) != address(0), "zero feeForwarder");
        erc4626Vault = erc4626Vault_;
        feeForwarder = feeForwarder_;
        gauge = IGauge(gauge_);

        IERC20(underlying_).approve(erc4626Vault_, type(uint256).max);
    }

    // ***************************************************
    //                VIEWS
    // ***************************************************

    /**
     * @dev Checks balance of managed assets
     */
    function _getAUM() internal view override returns (uint256) {
        return IERC4626(erc4626Vault).convertToAssets(IERC20(erc4626Vault).balanceOf(address(this)));
    }

    // ***************************************************
    //                MAIN LOGIC
    // ***************************************************

    /**
     * @dev Deposits capital into ERC4626 Vault
     * @param amount - the amount of tokens being deposited
     * @return the amount deposited
     */
    function _invest(uint256 amount) internal override returns (uint256) {
        uint256 balance = underlying.balanceOf(address(this));
        if (amount < balance) {
            balance = amount;
        }
        uint256 sharesBefore = IERC20(erc4626Vault).balanceOf(address(this));

        // invest to ERC4626 Vault
        IERC4626(erc4626Vault).deposit(balance, address(this));
        uint256 sharesAfter = IERC20(erc4626Vault).balanceOf(address(this));

        require(sharesAfter > sharesBefore, "AM should receive shares after the deposit");
        emit Invested(balance);
        return balance;
    }

    /**
     * @dev Withdraws capital out of ERC4626 Vault
     * @param amountUnderlying - the amount to withdraw
     * @return the number of tokens to return to the balancerVault
     */
    function _divest(uint256 amountUnderlying) internal override returns (uint256) {
        amountUnderlying = Math.min(amountUnderlying, IERC4626(erc4626Vault).maxWithdraw(address(this)));
        uint256 existingBalance = underlying.balanceOf(address(this));
        if (amountUnderlying > 0) {
            IERC4626(erc4626Vault).withdraw(amountUnderlying, address(this), address(this));
            uint256 newBalance = underlying.balanceOf(address(this));
            uint256 divested = newBalance.sub(existingBalance);
            require(divested > 0, "AM should receive requested tokens after the withdraw");
            emit Devested(divested);
            return divested;
        }
        return 0;
    }

    /// @dev Claim all rewards from given gague and send to feeForwarder
    function _claim() internal override {
        if (address(gauge) != address(0) && address(feeForwarder) != address(0)) {
            gauge.getAllRewards(address(erc4626Vault), address(this));
            uint256 rtLength = gauge.rewardTokensLength(address(erc4626Vault));
            address[] memory tokens = new address[](rtLength);

            for (uint256 i = 0; i < rtLength; i++) {
                IERC20 rt = IERC20(gauge.rewardTokens(address(erc4626Vault), i));
                uint256 bal = IERC20(rt).balanceOf(address(this));
                rt.safeTransfer(address(feeForwarder), bal);
                tokens[i] = address(rt);
                emit RewardClaimed(address(rt), bal);
            }
            feeForwarder.registerIncome(tokens, getPoolAddress());
        }
    }
}

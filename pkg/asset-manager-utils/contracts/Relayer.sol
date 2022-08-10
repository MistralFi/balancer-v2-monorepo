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
import "@balancer-labs/v2-interfaces/contracts/pool-utils/IAssetManagerBase.sol";
import "@balancer-labs/v2-interfaces/contracts/pool-utils/IRelayer.sol";
import "@balancer-labs/v2-interfaces/contracts/solidity-utils/misc/IWETH.sol";
import "@balancer-labs/v2-solidity-utils/contracts/openzeppelin/Address.sol";
import "@balancer-labs/v2-vault/contracts/AssetHelpers.sol";

/// @title Relayer
/// @dev this contract behaves as proxy for joinPool and exitPool operations.
///      Is able to move invested funds to the Balancer's vault and handle big exitPool requests.
///      Need to be approved by Balancer's governance.
contract Relayer is IRelayer, AssetHelpers {
    using Address for address payable;

    // ***************************************************
    //                CONSTANTS
    // ***************************************************

    // We start at a non-zero value to make EIP2200 refunds lower, meaning there'll be a higher chance of them being
    // fully effective.
    bytes32 internal constant _EMPTY_CALLED_POOL = bytes32(
        0x0000000000000000000000000000000000000000000000000000000000000001
    );

    // ***************************************************
    //                VARIABLES
    // ***************************************************

    IVault public immutable vault;
    bytes32 internal _calledPool;

    // ***************************************************
    //                  EVENTS
    // ***************************************************

    /// @dev all events are produced either AssetManagers or Balancer's vault.

    // ***************************************************
    //                CONSTRUCTOR
    // ***************************************************

    constructor(IVault _vault) AssetHelpers(_vault.WETH()) {
        vault = _vault;
        _calledPool = _EMPTY_CALLED_POOL;
    }

    // ***************************************************
    //                    VIEWS
    // ***************************************************

    /// @dev returns true if relayer processing rebalce request for the given pool (pool Id)
    function hasCalledPool(bytes32 poolId) external view override returns (bool) {
        return _calledPool == poolId;
    }

    receive() external payable {
        // Accept ETH transfers only coming from the Vault. This is only expected to happen when joining a pool,
        // any remaining ETH value will be transferred back to this contract and forwarded back to the original sender.
        _require(msg.sender == address(vault), Errors.ETH_TRANSFER);
    }

    // ***************************************************
    //                    CLAIM
    // ***************************************************

    /// @notice used to claim rewards from asset managers. Reward collection logic and
    ///         reward distribution controlled by AM
    function claimAssetManagerRewards(bytes32 poolId) external override {
        (IERC20[] memory tokens, , ) = vault.getPoolTokens(poolId);
        for (uint256 i = 0; i < tokens.length; i++) {
            (, , , address assetManager) = vault.getPoolTokenInfo(poolId, tokens[i]);
            if (assetManager != address(0)) {
                IAssetManagerBase(assetManager).claimRewards();
            }
        }
    }

    // ***************************************************
    //                    JOIN/EXIT
    // ***************************************************

    /// @notice a standard Balancer's vault joinPool request. Calls asset manager's rebalance logic.
    function joinPool(
        bytes32 poolId,
        address recipient,
        IVault.JoinPoolRequest memory request
    ) external payable rebalance(poolId, request.assets, new uint256[](request.assets.length)) {
        vault.joinPool{ value: msg.value }(poolId, msg.sender, recipient, request);

        // Send back to the sender any remaining ETH value
        if (address(this).balance > 0) {
            msg.sender.sendValue(address(this).balance);
        }
    }

    /// @notice standard Balancer's vault exitPool request with the extra param minCashBalances.
    ///         minCashBalances - amounts of tokens for withdraw (exitPool). Used to calculate if AM
    ///         should return tokens to the Balancer's vault to handle this request.
    ///         Calls asset manager's rebalance logic.
    function exitPool(
        bytes32 poolId,
        address payable recipient,
        IVault.ExitPoolRequest memory request,
        uint256[] memory minCashBalances
    ) external rebalance(poolId, request.assets, minCashBalances) {
        vault.exitPool(poolId, msg.sender, recipient, request);
    }

    // ***************************************************
    //                 REBALANCE
    // ***************************************************

    /// @dev used by joinPool and exitPool to handle big exitPool and 'soft' rebalance assets (invest/devest) via AM.
    modifier rebalance(
        bytes32 poolId,
        IAsset[] memory assets,
        uint256[] memory minCashBalances
    ) {
        require(_calledPool == _EMPTY_CALLED_POOL, "Rebalancing relayer reentered");
        IERC20[] memory tokens = _translateToIERC20(assets);
        _ensureCashBalance(poolId, tokens, minCashBalances);
        _calledPool = poolId;
        _;
        _rebalance(poolId, tokens);
        _calledPool = _EMPTY_CALLED_POOL;
    }

    /// @dev used to handle big withdraws by devesting required funds via AM and to update Balancer's vault with the
    ///      latest state of funds controlled by AM.
    function _ensureCashBalance(
        bytes32 poolId,
        IERC20[] memory tokens,
        uint256[] memory minCashBalances
    ) internal {
        for (uint256 i = 0; i < tokens.length; i++) {
            (uint256 cash, , , address assetManager) = vault.getPoolTokenInfo(poolId, tokens[i]);

            if (assetManager != address(0)) {
                uint256 cashNeeded = minCashBalances[i];
                if (cash < cashNeeded) {
                    // Withdraw the managed balance back to the pool to ensure that the cash covers the withdrawal
                    // This will automatically update the vault with the most recent managed balance
                    IAssetManagerBase(assetManager).capitalOut(poolId, cashNeeded - cash);
                } else {
                    // We want to ensure that the pool knows about all asset manager returns
                    // to avoid a new LP getting a share of returns earned before they joined.
                    // We then update the vault with the current managed balance manually.
                    IAssetManagerBase(assetManager).updateBalanceOfPool(poolId);
                }
            }
        }
    }

    /// @dev calls 'soft' rebalace for attached AM.
    function _rebalance(bytes32 poolId, IERC20[] memory tokens) internal {
        for (uint256 i = 0; i < tokens.length; i++) {
            (, , , address assetManager) = vault.getPoolTokenInfo(poolId, tokens[i]);
            if (assetManager != address(0)) {
                // Note that malicious Asset Managers could perform reentrant calls at this stage and e.g. try to exit
                // the Pool before Managers for other tokens have rebalanced. This is considered a non-issue as a) no
                // exploits should be enabled by allowing for this, and b) Pools trust their Asset Managers.

                // Do a non-forced rebalance
                IAssetManagerBase(assetManager).rebalance(poolId, false);
            }
        }
    }
}

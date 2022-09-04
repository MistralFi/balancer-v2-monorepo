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

import "@balancer-labs/v2-solidity-utils/contracts/openzeppelin/SafeERC20.sol";
import "@balancer-labs/v2-interfaces/contracts/pool-utils/IRelayer.sol";
import "@balancer-labs/v2-interfaces/contracts/vault/IVault.sol";
import "@balancer-labs/v2-interfaces/contracts/pool-utils/IConverter.sol";
import "@balancer-labs/v2-interfaces/contracts/pool-utils/ILiquidator.sol";
import "@balancer-labs/v2-solidity-utils/contracts/helpers/ERC20Helpers.sol";
import "@balancer-labs/v2-interfaces/contracts/pool-stable/StablePoolUserData.sol";

/// @title Convert any tokens to BPT token via relayer.
/// @author belbix
/// @author AlehN
contract RelayedConverterBPT is IConverter {
    using SafeERC20 for IERC20;

    // *************************************************************
    //                        CONSTANTS
    // *************************************************************

    /// @dev Denominator for different ratios. It is default for the whole platform.
    uint256 public constant RATIO_DENOMINATOR = 100_000;
    uint256 public constant DEFAULT_SLIPPAGE = 5_000;

    address public immutable owner;
    ILiquidator public immutable liquidator;
    address public immutable targetToken;
    bytes32 public immutable targetPoolId;
    uint256 public targetTokenThreshold;
    IRelayer public immutable relayer;

    mapping(address => uint256) public tokenSlippage;

    event TargetTokenThresholdChanged(uint256 oldValue, uint256 newValue);
    event SlippageChanged(address token, uint256 value);

    constructor(
        address _owner,
        address _liquidator,
        address _targetToken,
        bytes32 _targetPoolId,
        address _relayer
    ) {
        owner = _owner;
        liquidator = ILiquidator(_liquidator);
        targetToken = _targetToken;
        targetPoolId = _targetPoolId;
        relayer = IRelayer(_relayer);

        IERC20(_targetToken).approve(address(IRelayer(_relayer).vault()), type(uint256).max);
        (IRelayer(_relayer).vault()).setRelayerApproval(address(this), _relayer, true);
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "!owner");
        _;
    }

    function setSlippage(address token, uint256 value) external onlyOwner {
        require(value < RATIO_DENOMINATOR, "TOO_HIGH");

        tokenSlippage[token] = value;
        emit SlippageChanged(token, value);
    }

    function setTargetTokenThreshold(uint256 value) external onlyOwner {
        emit TargetTokenThresholdChanged(targetTokenThreshold, value);
        targetTokenThreshold = value;
    }

    function convert(
        address incomeToken,
        uint256 amount,
        address recipient
    ) external override returns (address) {
        (ILiquidator.PoolData[] memory route, string memory error) = liquidator.buildRoute(incomeToken, targetToken);

        if (route.length == 0) {
            revert(error);
        }

        uint256 targetTokenValue = liquidator.getPriceForRoute(route, amount);

        if (targetTokenValue > targetTokenThreshold) {
            uint256 slippage = tokenSlippage[incomeToken];
            if (slippage == 0) {
                slippage = DEFAULT_SLIPPAGE;
            }

            _approveIfNeed(incomeToken, address(liquidator), amount);
            liquidator.liquidateWithRoute(route, amount, slippage);

            _convertToBPT(recipient);
        }

        return targetToken;
    }

    function _convertToBPT(address recipient) internal {
        (IERC20[] memory tokens, , ) = (IRelayer(relayer).vault()).getPoolTokens(targetPoolId);
        uint256[] memory _amounts = new uint256[](tokens.length);

        for (uint256 i = 0; i < tokens.length; i++) {
            if (address(tokens[i]) == targetToken) {
                _amounts[i] = IERC20(targetToken).balanceOf(address(this));
                break;
            }
        }

        bytes memory userData = abi.encode(StablePoolUserData.JoinKind.EXACT_TOKENS_IN_FOR_BPT_OUT, _amounts, 0);

        IVault.JoinPoolRequest memory request = IVault.JoinPoolRequest(_asIAsset(tokens), _amounts, userData, false);
        IRelayer(relayer).joinPool(targetPoolId, recipient, request);
    }

    function _approveIfNeed(
        address token,
        address dst,
        uint256 amount
    ) internal {
        if (IERC20(token).allowance(address(this), dst) < amount) {
            IERC20(token).approve(dst, 0);
            IERC20(token).approve(dst, type(uint256).max);
        }
    }
}

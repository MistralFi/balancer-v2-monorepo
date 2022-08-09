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

import "@balancer-labs/v2-interfaces/contracts/pool-utils/IGauge.sol";
import "@balancer-labs/v2-solidity-utils/contracts/openzeppelin/SafeERC20.sol";

contract MockGague is IGauge {
    using SafeERC20 for IERC20;

    address[] internal _rewardTokens;
    uint256[] public dummyRewardAmounts;
    address public stackingToken;

    mapping(address => uint256) _rewardTokensLength;

    constructor(
        address[] memory rewardTokens,
        uint256[] memory _dummyRewardAmounts,
        address _stackingToken
    ) {
        require(_stackingToken != address(0), "zero stackingToken");
        _rewardTokens = rewardTokens;
        dummyRewardAmounts = _dummyRewardAmounts;
        stackingToken = _stackingToken;
        _rewardTokensLength[stackingToken] = rewardTokens.length;
    }

    function getAllRewards(address, address account) external override {
        for (uint256 i = 0; i < _rewardTokens.length; i++) {
            IERC20(_rewardTokens[i]).safeTransfer(account, dummyRewardAmounts[i]);
        }
    }

    function rewardTokensLength(address _stakingToken) external view override returns (uint256) {
        return _rewardTokensLength[_stakingToken];
    }

    function rewardTokens(address, uint256 tokenIndex) external view override returns (address) {
        return _rewardTokens[tokenIndex];
    }
}

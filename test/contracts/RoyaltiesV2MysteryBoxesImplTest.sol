// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;
pragma abicoder v2;

import "../../contracts/royalties/RoyaltiesV2MysteryBoxesImpl.sol";

contract RoyaltiesV2MysteryBoxesImplTest is RoyaltiesV2MysteryBoxesImpl {

    function __RoyaltiesV2MysteryBoxesImplTest_init(LibPart.Part[] memory _royalties) external initializer {
        __RoyaltiesV2Upgradeable_init_unchained();
        __RoyaltiesV2MysteryBoxesImpl_init_unchained(_royalties);
    }

}
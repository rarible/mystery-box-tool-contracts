// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;
pragma abicoder v2;

import "../../contracts/ERC721MysteryBoxes.sol";

contract ERC721MysteryBoxesTest is ERC721MysteryBoxes {
    function getMinted() public view returns(uint){
        return minted;
    }
}

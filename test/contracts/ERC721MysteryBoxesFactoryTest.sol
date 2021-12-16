// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;
pragma abicoder v2;

import "../../contracts/ERC721MysteryBoxesFactory.sol";

contract ERC721MysteryBoxesFactoryTest is ERC721MysteryBoxesFactory {
    constructor(
        address _implementation,
        address _transferProxy,
        address _operatorProxy,
        string memory _baseURI
    ) ERC721MysteryBoxesFactory(_implementation, _transferProxy, _operatorProxy, _baseURI) {}
}

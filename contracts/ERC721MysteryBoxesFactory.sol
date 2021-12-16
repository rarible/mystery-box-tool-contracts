// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;
pragma abicoder v2;

import "./ERC721MysteryBoxes.sol";
import "@openzeppelin/contracts/proxy/TransparentUpgradeableProxy.sol";
import "@openzeppelin/contracts/proxy/ProxyAdmin.sol";

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @dev This contract is for creating proxy to access ERC721MysteryBoxes token.
 *
 * The beacon should be initialized before call ERC721MysteryBoxesFactory constructor.
 */
contract ERC721MysteryBoxesFactory is Ownable {
    //implementation of token
    address public implementation;

    //transferProxy to call transferFrom
    address public transferProxy;

    //operatorProxy to mint tokens
    address public operatorProxy;

    //baseURI for collections
    string public baseURI;

    event CollectionCreated(address owner, address collection, address admin);

    constructor(
        address _implementation,
        address _transferProxy,
        address _operatorProxy,
        string memory _baseURI
    ) {
        implementation = _implementation;
        transferProxy = _transferProxy;
        operatorProxy = _operatorProxy;
        baseURI = _baseURI;
    }

    function createCollection(
        string memory _name,
        string memory _symbol,
        LibPart.Part[] memory _royalties,
        uint256 _total,
        uint256 _maxValue
    ) external {
        bytes memory data = abi.encodeWithSelector(
            ERC721MysteryBoxes(0).__ERC721MysteryBoxes_init.selector,
            _name,
            _symbol,
            baseURI,
            transferProxy,
            operatorProxy,
            _royalties,
            _total,
            _maxValue
        );
        ProxyAdmin admin = new ProxyAdmin();
        admin.transferOwnership(_msgSender());

        TransparentUpgradeableProxy proxy = new TransparentUpgradeableProxy(implementation, address(admin), data);
        ERC721MysteryBoxes token = ERC721MysteryBoxes(address(proxy));
        token.transferOwnership(_msgSender());

        emit CollectionCreated(_msgSender(), address(token), address(admin));
    }

    function changeImplementation(address _implementation) external onlyOwner() {
      implementation = _implementation;
    }

    function changeBaseURI(string memory _baseURI) external onlyOwner() {
        baseURI = _baseURI;
    }
}

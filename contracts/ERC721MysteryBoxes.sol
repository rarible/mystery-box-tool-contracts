// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;
pragma abicoder v2;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";

import "./interfaces/IERC721GenMint.sol";
import "./royalties/RoyaltiesV2MysteryBoxesImpl.sol";
import "./tokens/ERC721GenDefaultApproval.sol";
import "./tokens/ERC721GenOperatorRole.sol";
import "./tokens/HasContractURI.sol";

//import "./traits/TraitsManager.sol";

contract ERC721MysteryBoxes is OwnableUpgradeable, ERC721GenDefaultApproval, HasContractURI, RoyaltiesV2MysteryBoxesImpl, ERC721GenOperatorRole {
    using SafeMathUpgradeable for uint;
    using StringsUpgradeable for uint;

    event MysteryBoxesTotal(uint total);
    event MysteryBoxesMint(uint indexed tokenId, uint number);

    //max amount of tokens in existance
    uint public total;

    //max amount of tokens to be minted in one transaction
    uint public maxValue;

    //amount of minted tokens
    uint minted;

    //seed
    uint public seed;

    function __ERC721MysteryBoxes_init(
        string memory _name,
        string memory _symbol,
        string memory _baseURI,
        address _transferProxy,
        address _operatorProxy,
        LibPart.Part[] memory _royalties,
        uint _total,
        uint _maxValue
    ) external initializer {
        __HasContractURI_init_unchained(_baseURI);
        __RoyaltiesV2Upgradeable_init_unchained();
        __RoyaltiesV2MysteryBoxesImpl_init_unchained(_royalties);
        __Context_init_unchained();
        __ERC165_init_unchained();
        __Ownable_init_unchained();
        __ERC721_init_unchained(_name, _symbol);
        __ERC721GenDefaultApproval_init_unchained(_transferProxy);
        __ERC721GenOperatorRole_init_unchained(_operatorProxy);
        __ERC721MysteryBoxes_init_unchained(_total, _maxValue);
    }

    function __ERC721MysteryBoxes_init_unchained(uint _total, uint _maxValue) internal initializer {
        maxValue = _maxValue;
        total = _total;
        emit MysteryBoxesTotal(total);
    }

    //mint "value" amount of tokens and transfer them to "to" address
    function mint(address artist, address to, uint value) onlyOperator() public {
        require(value > 0 && value <= maxValue, "incorrect value of tokens to mint");
        require(seed == 0, "can`t mint");
        require(artist == owner(), "artist is not an owner"); //TODO need this require?

        uint totalSupply = minted;
        require(totalSupply.add(value) <= total, "all minted");

        for (uint i = 0; i < value; i ++) {
            mintSingleToken(totalSupply + i, to);
        }
        minted = totalSupply.add(value);
    }

    //mint one token
    function mintSingleToken(uint tokenId, address to) internal {
        uint _tokenId = tokenId + 1;
        _mint(to, _tokenId);

        emit MysteryBoxesMint(_tokenId, _tokenId);
    }

    function _emitMintEvent(address to, uint tokenId) internal virtual override {
        address _owner = owner();
        emit Transfer(address(0), _owner, tokenId);
        emit Transfer(_owner, to, tokenId);
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        return string(abi.encodePacked(contractURI, "/", tokenId.toString()));
    }

    function reveal() public onlyOwner {
        seed = uint(keccak256(abi.encodePacked(block.timestamp, block.number, block.difficulty, maxValue, minted)));
    }

    uint256[50] private __gap;
}

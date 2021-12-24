const ERC721MysteryBoxes = artifacts.require("ERC721MysteryBoxes.sol");
const ERC721MysteryBoxesFactoryTest = artifacts.require("ERC721MysteryBoxesFactoryTest.sol");
const ProxyAdminTest = artifacts.require("ProxyAdminTest.sol");

const truffleAssert = require('truffle-assertions');
const events = require("../library/events");
const fakeBlock = require("../library/fake-block");

contract("ERC721MysteryBoxesFactoryTest", accounts => {
  const transferProxy = accounts[8];
  const operatorProxy = accounts[7];
  const baseURI = "https://ipfs.rarible.com/"
  let factory;
  let impl;

  beforeEach(async () => {
    impl = await ERC721MysteryBoxes.new();
    factory = await ERC721MysteryBoxesFactoryTest.new(impl.address, transferProxy, operatorProxy, baseURI);
  });

  it("should correctly deploy factory", async () => {
    assert.equal(await factory.implementation(), impl.address, "impl")
    assert.equal(await factory.transferProxy(), transferProxy, "transferProxy")
    assert.equal(await factory.operatorProxy(), operatorProxy, "operatorProxy")
    assert.equal(await factory.baseURI(), baseURI, "baseURI")
  });

  it("changeing implemntation should work correctly", async () => {
    const newImpl = accounts[5]
    await factory.changeImplementation(newImpl);
    assert.equal(await factory.implementation(), newImpl, "newImpl")

    await truffleAssert.fails(
      factory.changeImplementation(newImpl, { from: accounts[2] }),
      truffleAssert.ErrorType.REVERT,
      "Ownable: caller is not the owner"
    )
  });

  it("should correctly create token from factory", async () => {
    const total = 3;
    const collectionRoyalties = [[accounts[5], 700]]
    const name = "Tc"
    const symbol = "T"
    const maxValue = 10;
    const initData = [name, symbol, collectionRoyalties,  total, maxValue];

    const artist = accounts[2]

    const tx = await factory.createCollection(...initData, { from: artist });
    console.log(tx.receipt.gasUsed)

    const [CollectionCreatedEvent] = events(tx, "CollectionCreated");
    assert.equal(CollectionCreatedEvent.args.owner, artist, "CollectionCreatedEvent owner")

    const proxyAdmin = await ProxyAdminTest.at(CollectionCreatedEvent.args.admin);
    assert.equal(await proxyAdmin.owner(), artist, "artsit is the owner of proxyAdmin")

    const token = await ERC721MysteryBoxes.at(CollectionCreatedEvent.args.collection)

    const MysteryBoxesTotalEvent = await token.getPastEvents("MysteryBoxesTotal", {
      fromBlock: tx.receipt.blockNumber,
      toBlock: tx.receipt.blockNumber
    });

    assert.equal(MysteryBoxesTotalEvent[0].args.total.toNumber(), total, "total supply")

    assert.equal(await token.owner(), artist, "artist is the owner")
    assert.equal(await token.total(), total, "total")
    assert.equal(await token.maxValue(), maxValue, "maxValue")
    assert.equal(await token.name(), name, "name")
    assert.equal(await token.symbol(), symbol, "symbol")
    assert.equal(await token.contractURI(), baseURI + token.address.toLowerCase(), "contractURI")

    //check royalties
    const royalty = await token.getRaribleV2Royalties(0);
    assert.equal(royalty[0].account, collectionRoyalties[0][0], "get royalties account")
    assert.equal(royalty[0].value, collectionRoyalties[0][1], "get royalties value")

  });

  it("should be able to mint many tokens", async () => {
    const total = 30;
    const collectionRoyalties = [[accounts[5], 700]]
    const name = "Tc"
    const symbol = "T"
    const maxValue = 10;
    const initData = [name, symbol, collectionRoyalties, total, maxValue];

    const artist = accounts[2]
    const buyer = accounts[3];

    const tx = await factory.createCollection(...initData, { from: artist });
    const [CollectionCreatedEvent] = events(tx, "CollectionCreated");
    const token = await ERC721MysteryBoxes.at(CollectionCreatedEvent.args.collection)

    const mintTx1 = await token.mint(artist, buyer, 10, { from: operatorProxy })
    console.log(mintTx1.receipt.gasUsed)

    await truffleAssert.fails(
      token.mint(artist, buyer, 11, { from: operatorProxy }),
      truffleAssert.ErrorType.REVERT,
      "incorrect value of tokens to mint"
    )

    await truffleAssert.fails(
      token.mint(artist, buyer, 0, { from: operatorProxy }),
      truffleAssert.ErrorType.REVERT,
      "incorrect value of tokens to mint"
    )

    await truffleAssert.fails(
      token.mint(artist, buyer, 1, { from: transferProxy }),
      truffleAssert.ErrorType.REVERT,
      "OperatorRole: caller is not the operator"
    )
  });

//  async function parseMysteryBoxesMint(contract, tx) {
//    const events = await contract.getPastEvents("MysteryBoxesMinted", {
//      fromBlock: tx.receipt.blockNumber,
//      toBlock: tx.receipt.blockNumber
//    });
//
//    let result = []
//
//    for (const ev of events) {
//      result.push(ev.args.minted.toString())
//    }
//    return result;
//  }

});
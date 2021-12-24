const truffleAssert = require('truffle-assertions');
const events = require("../library/events");
const fakeBlock = require("../library/fake-block");

const ERC721MysteryBoxes = artifacts.require("ERC721MysteryBoxes.sol");
const ERC721MysteryBoxesTest = artifacts.require("ERC721MysteryBoxesTest.sol");

contract("ERC721MysteryBoxes", accounts => {
  let testing;
  const baseURI = "https://ipfs.rarible.com/";
  beforeEach(async () => {
    testing = await ERC721MysteryBoxes.new();

    let transferProxy = accounts[8];
    let operatorProxy = accounts[0];

    await testing.__ERC721MysteryBoxes_init("T", "T", baseURI, transferProxy, operatorProxy, [[accounts[3], 100]], 100, 10);
  });

  it("should set base uri with toke addr and contract uri", async () => {
    assert.equal(await testing.contractURI(), baseURI + testing.address.toLowerCase(), "contract URI")
  })

  it("should support contract uri interface", async () => {
    const _INTERFACE_ID_CONTRACT_URI = "0xe8a3d485"
    assert.equal(await testing.supportsInterface(_INTERFACE_ID_CONTRACT_URI), true, "interface contract uri")
  })

  it("should return correct tokenURI", async () => {
    const tokenURI0 = await testing.tokenURI(0);
    const tokenURI1 = await testing.tokenURI(1);

    const contractURI = await testing.contractURI()
    const shouldBeContractURI = baseURI + testing.address.toLowerCase();
    assert.equal(contractURI, shouldBeContractURI, "contractURI")

    const shouldBeURI = contractURI + "/" + "0" + "/";

    assert.equal(tokenURI0, shouldBeURI + "0", "token URI")
    assert.equal(tokenURI1, shouldBeURI + "1", "token URI")
    console.log("tokenURI0:", tokenURI0);
  })

  it("fails if artist is incorrect", async () => {
    await truffleAssert.fails(
      testing.mint(testing.address, accounts[1], 1),
      truffleAssert.ErrorType.REVERT,
      "artist is not an owner"
    )
  })

  it("mints a token if everything's correct", async () => {
    const tx = await testing.mint(accounts[0], accounts[1], 1);
    console.log(tx.receipt.gasUsed)
    const MysteryBoxesMintEvent = await testing.getPastEvents("MysteryBoxesMinted", {
      fromBlock: tx.receipt.blockNumber,
      toBlock: tx.receipt.blockNumber
    });
    const ev = MysteryBoxesMintEvent[0];
    const tokenId = ev.args.minted;
    assert(tokenId, "tokenId");

    const Transfer = await testing.getPastEvents("Transfer", {
      fromBlock: tx.receipt.blockNumber,
      toBlock: tx.receipt.blockNumber
    });

    const transfer1 = Transfer[0].args;
    assert.equal(transfer1.from, "0x0000000000000000000000000000000000000000", "from zero")
    assert.equal(transfer1.to, accounts[0], "to artsit")
    assert.equal(transfer1.tokenId.toString(), tokenId.toString(), "tokenId transfer 1")

    const transfer2 = Transfer[1].args;
    assert.equal(transfer2.from, accounts[0], "from artist")
    assert.equal(transfer2.to, accounts[1], "to buyer")
    assert.equal(transfer2.tokenId.toString(), tokenId.toString(), "tokenId transfer 1")
  })

  it("fails if more than total requested", async () => {
    for (let i = 0; i < 10; i++) {
      const tx = await testing.mint(accounts[0], accounts[1], 10);
      console.log("Used gas: ", tx.receipt.gasUsed)
    }
    //10 times * 10 mints = 100, try to mint 101 - fail
    await truffleAssert.fails(
      testing.mint(accounts[0], accounts[1], 1),
      truffleAssert.ErrorType.REVERT,
      "all minted"
    )
  })

  it("default approver should work", async () => {
    const tx = await testing.mint(accounts[0], accounts[1], 1);

    const MysteryBoxesMintEvent = await testing.getPastEvents("MysteryBoxesMinted", {
      fromBlock: tx.receipt.blockNumber,
      toBlock: tx.receipt.blockNumber
    });

    const ev = MysteryBoxesMintEvent[0];
    const tokenId = ev.args.minted;

    assert.equal(await testing.ownerOf(tokenId), accounts[1], "owner of")

    await testing.transferFrom(accounts[1], accounts[8], tokenId, { from: accounts[8] })

    assert.equal(await testing.ownerOf(tokenId), accounts[8], "owner of")

    await truffleAssert.fails(
      testing.transferFrom(accounts[8], accounts[0], tokenId, { from: accounts[0] }),
      truffleAssert.ErrorType.REVERT,
      "ERC721: transfer caller is not owner nor approved"
    )
  })

  it("minted value should increment", async () => {

    const erc721test = await ERC721MysteryBoxesTest.new();

    let transferProxy = accounts[8];
    let operatorProxy = accounts[0];

    await erc721test.__ERC721MysteryBoxes_init("T", "T", baseURI, transferProxy, operatorProxy, [[accounts[3], 100]], 100, 10);

    assert.equal(await erc721test.getMinted(), 0, "minted")

    for (let i = 1; i < 11; i++) {
      await erc721test.mint(accounts[0], accounts[1], 1);
      assert.equal(await erc721test.getMinted(), i, "minted")
    }

    await erc721test.mint(accounts[0], accounts[1], 7);
    assert.equal(await erc721test.getMinted(), 17, "minted")
  })

  it("check emit event MysteryBoxesReveal while run reveal()", async () => {
    const tx = await testing.mint(accounts[0], accounts[1], 1);

    const MysteryBoxesMintEvent = await testing.getPastEvents("MysteryBoxesMinted", {
      fromBlock: tx.receipt.blockNumber,
      toBlock: tx.receipt.blockNumber
    });

    const ev = MysteryBoxesMintEvent[0];
    const tokenId = ev.args.minted;

    const txReveal = await testing.reveal();
//  emit  MysteryBoxesReveal(seed, minted, total)
    const MysteryBoxesRevealEvent = await testing.getPastEvents("MysteryBoxesReveal", {
      fromBlock: txReveal.receipt.blockNumber,
      toBlock: txReveal.receipt.blockNumber
    });

    const evReveal = MysteryBoxesRevealEvent[0];
    const seed = evReveal.args.seed;
    const minted = evReveal.args.minted;
    const total = evReveal.args.total;

    console.log("seed: ", Number(seed));
    assert.equal(minted, 1, "minted");
    assert.equal(total, 100, "total");

    await truffleAssert.fails(
      testing.mint(accounts[0], accounts[1], 1),
      truffleAssert.ErrorType.REVERT,
      "already reveal can`t mint"
    )
  })

})
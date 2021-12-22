const ERC721MysteryBoxes = artifacts.require('ERC721MysteryBoxes');
const ERC721MysteryBoxesFactory = artifacts.require('ERC721MysteryBoxesFactory');

module.exports = async function (deployer, network, accounts) {

	//if it's a test network we don't need this migration
	if (network === "test") {
		return;
	}

	await deployer.deploy(ERC721MysteryBoxes, { gas: 3200000 });
	const impl = await ERC721MysteryBoxes.deployed()
	console.log("Deployed new impl at", impl.address);

	const factory = await ERC721MysteryBoxesFactory.deployed()
	await factory.changeImplementation(impl.address, { gas: 100000 })
};

const contract = require("@truffle/contract");
const { id, MYSTERY_BOXES, enc } = require('../library/assets.js')

const adminJson = require("@openzeppelin/upgrades-core/artifacts/ProxyAdmin.json")
const ProxyAdmin = contract(adminJson)
ProxyAdmin.setProvider(web3.currentProvider)

const beaconJSON = require("@openzeppelin/contracts/build/contracts/UpgradeableBeacon.json")
const UpgradeableBeacon = contract(beaconJSON)
UpgradeableBeacon.setProvider(web3.currentProvider)

const ERC721MysteryBoxes = artifacts.require('ERC721MysteryBoxes');
const ERC721MysteryBoxesFactory = artifacts.require('ERC721MysteryBoxesFactory');
const ExchangeSetTransferProxy = artifacts.require('ExchangeSetTransferProxy');

const zero = "0x0000000000000000000000000000000000000000"

const rinkeby = {
	baseURI: "https://rinkeby.traitsy.com/meta/", //base uri for all collections created in the factory
	transferProxy: "0x7d47126a2600E22eab9eD6CF0e515678727779A6", // transferProxyAddress to set as default approver (to call transfer from on trades)
	exchangeV2: "0xd4a57a3bD3657D0d46B4C5bAC12b3F156B9B886b", // exchangev2 address to set operatorProxy in, operator proxy is goint to mint tokens
	operatorProxy: zero //already deployed contract ERC721GenMintTransferProxy use token.mint inside
}
const mainnet = {
	baseURI: "https://traitsy.com/meta/",
	transferProxy: "0x4fee7b061c97c9c496b01dbce9cdb10c02f0a0be",
	exchangeV2: "0x9757F2d2b135150BBeb65308D4a91804107cd8D6",
	operatorProxy: "0xcAAAcf1a668446476626dDcad4a237D70c61Efa9"
}
const ropsten = {
	baseURI: "https://mystery-box-tool.ngrok.io/meta/",
	transferProxy: "0xf8e4ecac18b65fd04569ff1f0d561f74effaa206",
	exchangeV2: "0x33Aef288C093Bf7b36fBe15c3190e616a993b0AD",
	operatorProxy: "0x0000000000000000000000000000000000000000"
}
const e2e = {
	baseURI: "",
	transferProxy: "0x66611f8d97688a0af08d4337d7846efec6995d58",
	exchangeV2: "0x0000000000000000000000000000000000000000",
	operatorProxy: "0x0000000000000000000000000000000000000000"
}
const def = {
	baseURI: "https://ipfs.rarible.com",
	transferProxy: "0x0000000000000000000000000000000000000000",
	exchangeV2: "0x0000000000000000000000000000000000000000",
	operatorProxy: "0x0000000000000000000000000000000000000000"
}
let settings = {
	"default": def,
	"rinkeby": rinkeby,
	"rinkeby-fork": rinkeby,
	"ropsten": ropsten,
	"ropsten-fork": ropsten,
	"mainnet": mainnet,
	"mainnet-fork": mainnet,
	"e2e": e2e,
	"e2e-fork": e2e
};

function getSettings(network) {
	if (settings[network] !== undefined) {
		return settings[network];
	} else {
		return settings["default"];
	}
}

module.exports = async function (deployer, network, accounts) {

	//if it's a test network we don't need this migration
	if (network === "test") {
		return;
	}

	const settings = getSettings(network);
	console.log("settings:")
	console.dir(settings, { depth: null });

	//settings are required
	if (
		settings.transferProxy === zero ||
		settings.exchangeV2 === zero ||
		!settings.baseURI
	) {
		throw new Error(`need to set settings for network ${network}`);
	}

	//setting address of operatorProxy in exchangeV2 for new type - MYSTERY_BOXES
	const exchangeSetTransferProxy = await ExchangeSetTransferProxy.at(settings.exchangeV2)
	await exchangeSetTransferProxy.setTransferProxy(MYSTERY_BOXES, settings.operatorProxy, { gas: 100000 })

	//deploying ERC721MysteryBoxes implementation
	await deployer.deploy(ERC721MysteryBoxes, { gas: 5500000 });
	const impl = await ERC721MysteryBoxes.deployed()
	console.log("ERC721MysteryBoxes impl at", impl.address)

	//deploying factory
	const factory = await deployer.deploy(ERC721MysteryBoxesFactory, impl.address, settings.transferProxy, settings.operatorProxy, settings.baseURI, {gas: 3000000});
	console.log(`factory deployed at ${factory.address}`)
};

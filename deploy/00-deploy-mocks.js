/*
This deploy function will check if the network is on a development chain. If it is, it will deploy mock contracts (the V3Aggregator) on the test network so our contract will work

*/

const {
    networkConfig,
    developmentChains,
    DECIMALS,
    INITIAL_ANSWER,
} = require("../helper-hardhat-config")
const { network } = require("hardhat")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    if (developmentChains.includes(network.name)) {
        log("Local network detected. Deploying mocks...")
        await deploy("MockV3Aggregator", {
            contract: "MockV3Aggregator",
            from: deployer,
            logs: true,
            args: [DECIMALS, INITIAL_ANSWER],
        })
        log("Mocks deployed")
        log("--------------------------------------")
    }
}
//Need to read up more on how tags work but you can explicitly add the mocks tag to deployer to be able to deploy mocks if you know you're doing a test chain - doesn't seem worth it though.
module.exports.tags = ["all", "mocks"]

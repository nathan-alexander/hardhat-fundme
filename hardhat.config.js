require("dotenv").config()
//hardhat-etherscan is used to interact with etherscan - you need an API key which you put in the config below
require("@nomiclabs/hardhat-etherscan")
//waffle is a test suite
require("@nomiclabs/hardhat-waffle")
//gas reporter will output a text file (or in console) which shows the gas usage of each contract call
require("hardhat-gas-reporter")
//test coverage module
require("solidity-coverage")
//hardhat-deploy is a deploy module which you can use instead of a singular script
require("hardhat-deploy")

const RINKEBY_RPC_URL = process.env.RINKEBY_RPC_URL || "https://eth-rinkeby"
const PRIVATE_KEY = process.env.PRIVATE_KEY || "key"
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "key"
const CMC_API_KEY = process.env.CMC_API_KEY || "key"

module.exports = {
    solidity: {
        compilers: [{ version: "0.8.8" }, { version: "0.6.6" }],
    },
    defaultNetwork: "hardhat",
    networks: {
        rinkeby: {
            url: RINKEBY_RPC_URL,
            accounts: [PRIVATE_KEY],
            chainId: 4,
            blockConfirmations: 6,
        },
        lcalhost: {
            url: "http://127.0.0.1:8545/",
            chainId: 31337,
        },
    },
    gasReporter: {
        enabled: process.env.REPORT_GAS !== undefined,
        currency: "USD",
        output: "gas-report.txt",
    },
    etherscan: {
        apiKey: {
            rinkeby: ETHERSCAN_API_KEY,
        },
    },
    namedAccounts: {
        deployer: {
            default: 0,
        },
        user: {
            default: 1,
        },
    },
}

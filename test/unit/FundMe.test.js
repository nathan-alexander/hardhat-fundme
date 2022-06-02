//import expect and assert from chai

const { expect, assert } = require("chai")
const { ethers, deployments, getNamedAccounts } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

//First part of the test is the describe, this is a high level description
//normally you will want to write beforeEach() in your testing. It will run before each it statement.
//Example: beforeEach() -> create the contract factory and deploy the contract.
//you write it for each test you want to write - it should...
!developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", function () {
          let FundMeFactory, fundMeContract, owner, deployer, mockV3Aggregator
          const sendValue = ethers.utils.parseEther("1")
          beforeEach(async function () {
              //gets the deployer account
              deployer = (await getNamedAccounts()).deployer
              //deploys everything in deploy folder - based on all tag
              await deployments.fixture(["all"])
              //gets most recently deployed FundMe contract
              fundMeContract = await ethers.getContract("FundMe", deployer)
              mockV3Aggregator = await ethers.getContract(
                  "MockV3Aggregator",
                  deployer
              )
          })
          describe("constructor", async function () {
              it("sets the aggregator adresses corectly", async function () {
                  const response = await fundMeContract.getPriceFeed()
                  assert.equal(response, mockV3Aggregator.address)
              })
          })

          describe("fund", async function () {
              it("fails if you don't send enough eth", async function () {
                  await expect(fundMeContract.fund()).to.be.revertedWith(
                      "Minimum not met."
                  )
              })
              it("updates the amount funded data structure", async function () {
                  await fundMeContract.fund({ value: sendValue })
                  const response =
                      await fundMeContract.getAddressToContribution(deployer)
                  assert.equal(response.toString(), sendValue.toString())
              })
              it("adds funder to array of getFunder", async function () {
                  await fundMeContract.fund({ value: sendValue })
                  const funder = await fundMeContract.getFunder(0)
                  assert.equal(funder, deployer)
              })
          })
          describe("withdraw", async function () {
              beforeEach(async function () {
                  await fundMeContract.fund({ value: sendValue })
              })

              it("withdraw eth from a single founder", async function () {
                  //arrange
                  const startingFundMeBalance =
                      await fundMeContract.provider.getBalance(
                          fundMeContract.address
                      )
                  const startingDeployerBalance =
                      await fundMeContract.provider.getBalance(deployer)
                  //act
                  const transactionResponse = await fundMeContract.withdraw()
                  const transactionReceipt = await transactionResponse.wait(1)
                  //pull the gasUsed and effectiveGasPrice out of the transactionReceipt
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  //multiply for gasCost
                  const gasCost = gasUsed.mul(effectiveGasPrice)
                  const endingFundMeBalance =
                      await fundMeContract.provider.getBalance(
                          fundMeContract.address
                      )
                  const endingDeployerBalance =
                      await fundMeContract.provider.getBalance(deployer)
                  //assert
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString(),
                      endingDeployerBalance.add(gasCost).toString()
                  )
              })
              it("allows us to withdraw with multiple getFunder", async function () {
                  //get all accounts from the ethers provider
                  const accounts = await ethers.getSigners()
                  //loop thru the accounts and connect them to account
                  for (let i = 1; i < 6; i++) {
                      const fundMeConnectedContract =
                          await fundMeContract.connect(accounts[i])
                      //fund the account
                      await fundMeConnectedContract.fund({ value: sendValue })
                  }
                  const startingFundMeBalance =
                      await fundMeContract.provider.getBalance(
                          fundMeContract.address
                      )
                  const startingDeployerBalance =
                      await fundMeContract.provider.getBalance(deployer)

                  const transactionResponse = await fundMeContract.withdraw()
                  const transactionReceipt = await transactionResponse.wait(1)
                  //pull the gasUsed and effectiveGasPrice out of the transactionReceipt
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  //multiply for gasCost
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  const endingFundMeBalance =
                      await fundMeContract.provider.getBalance(
                          fundMeContract.address
                      )
                  const endingDeployerBalance =
                      await fundMeContract.provider.getBalance(deployer)
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString(),
                      endingDeployerBalance.add(gasCost).toString()
                  )
                  //make sure getFunder are reset - checking to see if the first position is empty
                  await expect(fundMeContract.getFunder()).to.be.reverted
                  //check the mapping data structure to make sure all getFunder are cleared
                  for (i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMeContract.getAddressToContribution(
                              accounts[i].address
                          ),
                          0
                      )
                  }
              })
              it("allows only the owner to withdraw", async function () {
                  const accounts = await ethers.getSigners()
                  const fundMeConnectedContract = await fundMeContract.connect(
                      accounts[1]
                  )
                  await expect(
                      fundMeConnectedContract.withdraw()
                  ).to.be.revertedWith("FundMe__NotOwner")
              })
              it("cheaperWithdraw teseting...", async function () {
                  //get all accounts from the ethers provider
                  const accounts = await ethers.getSigners()
                  //loop thru the accounts and connect them to account
                  for (let i = 1; i < 6; i++) {
                      const fundMeConnectedContract =
                          await fundMeContract.connect(accounts[i])
                      //fund the account
                      await fundMeConnectedContract.fund({ value: sendValue })
                  }
                  const startingFundMeBalance =
                      await fundMeContract.provider.getBalance(
                          fundMeContract.address
                      )
                  const startingDeployerBalance =
                      await fundMeContract.provider.getBalance(deployer)

                  const transactionResponse =
                      await fundMeContract.cheaperWithdraw()
                  const transactionReceipt = await transactionResponse.wait(1)
                  //pull the gasUsed and effectiveGasPrice out of the transactionReceipt
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  //multiply for gasCost
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  const endingFundMeBalance =
                      await fundMeContract.provider.getBalance(
                          fundMeContract.address
                      )
                  const endingDeployerBalance =
                      await fundMeContract.provider.getBalance(deployer)
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString(),
                      endingDeployerBalance.add(gasCost).toString()
                  )
                  //make sure getFunder are reset - checking to see if the first position is empty
                  await expect(fundMeContract.getFunder()).to.be.reverted
                  //check the mapping data structure to make sure all getFunder are cleared
                  for (i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMeContract.getAddressToContribution(
                              accounts[i].address
                          ),
                          0
                      )
                  }
              })
          })
      })

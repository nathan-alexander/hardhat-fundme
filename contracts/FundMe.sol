// SPDX-License-Identifier: MIT
//Pragma
pragma solidity ^0.8.8;
//Imports
//Import the PriceConverter library
import "./PriceConverter.sol";
//Error codes
//There are now defined errors in Solidity that require less gas.
error FundMe__NotOwner();

//This contract will be used to get funds from users, withdraw funds, set a minimum funding value in USD
/** @title A contract for crowdfunding
 *   @author Nathan Alexander
 *   @notice This contract is to demo a sample funding contract
 *   @dev This implements price feeds as our library
 */
contract FundMe {
    //Type Declarations

    //This is how we use the library as extensions - any library method that returns uint256 can be used as a method on uint256
    using PriceConverter for uint256;
    //State Variables
    uint256 public constant MINIMUM_USD = 50 * 1e18;

    address[] private s_funders;
    mapping(address => uint256) public s_addressToContribution;

    address private immutable i_owner;

    AggregatorV3Interface private s_priceFeed;

    modifier onlyOwner() {
        //require(msg.sender == i_owner, "Sender is not owner.");

        //Better way than require because it says gas.
        if (msg.sender != i_owner) {
            revert FundMe__NotOwner();
        }
        _;
    }

    constructor(address priceFeedAddress) {
        i_owner = msg.sender;
        s_priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    receive() external payable {
        fund();
    }

    fallback() external payable {
        fund();
    }

    //The payable modifier lets the compiler know that value can be sent to this function. The balance is stored in the contract's address.
    /**
     *   @notice This function allows function callers to fund the contract
     *   @dev Funders will be added to the map and the funders array
     */
    function fund() public payable {
        //Want to be able to set a minimum fund amount in USD

        //msg.value gets the amount of value sent in the transaction
        //The require method is a checker, it will make sure that msg.value is at least 50 USD or revert
        //msg.value is uint256 so we can call getConversionRate on it implicity, we don't need to pass in the parameter - it is inferred.
        //If you have additional parameters, they must be passed in.
        require(
            msg.value.getConversationRate(s_priceFeed) >= MINIMUM_USD,
            "Minimum not met."
        );
        s_funders.push(msg.sender);
        s_addressToContribution[msg.sender] = msg.value;
        //Reverting: All computation that fails gets the value returned to the user. All prior work will still cost gas but be undone.
    }

    function showContribution(address _address) public view returns (uint256) {
        return s_addressToContribution[_address];
    }

    function withdraw() public onlyOwner {
        //for loops in Solidity take three arguments: starting index, ending index, and step amount.
        //We define a variable and set it to 0 for the starting index
        //We set the ending condition, the funderIndex variable can't be larger than the funders array
        //We increment fundersIndex
        for (
            uint256 funderIndex = 0;
            funderIndex < s_funders.length;
            funderIndex++
        ) {
            address funder = s_funders[funderIndex];
            s_addressToContribution[funder] = 0;
        }
        //reset the array
        //This sets funders to a new array with no elements in it - this is what the (0) means.
        s_funders = new address[](0);
        //withdraw funds

        //msg.sender = address
        //payable(msg.sender) = payable address

        //As of right now call is the best way to send funds from a contract.
        //We say (bool callSuccess, ) because call returns two values, but we only want to use callSuccess so we disregard the other
        //To use call as a payment, we have to include the value in the call, which is set to address(this).balance;
        //"this" always refers to the current contract, so we are saying get the balance of this contract's address.
        //the ("") is necessary because call is a base level function and can call other functions, but we don't want it to - so we leave it blank with empty string.
        (bool callSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        //We are going to use the callSuccess bool to make sure the transaction went thru. This is so we can revert and not waste funds if it fails.
        require(callSuccess, "Call failed");
    }

    function cheaperWithdraw() public payable onlyOwner {
        address[] memory funders = s_funders;
        for (
            uint256 funderIndex = 0;
            funderIndex < funders.length;
            funderIndex++
        ) {
            address funder = funders[funderIndex];
            s_addressToContribution[funder] = 0;
        }
        s_funders = new address[](0);
        (bool success, ) = i_owner.call{value: address(this).balance}("");
        require(success);
    }

    function getOwner() public view returns (address) {
        return i_owner;
    }

    function getFunder(uint256 index) public view returns (address) {
        return s_funders[index];
    }

    function getAddressToContribution(address funder)
        public
        view
        returns (uint256)
    {
        return s_addressToContribution[funder];
    }

    function getPriceFeed() public view returns (AggregatorV3Interface) {
        return s_priceFeed;
    }
}

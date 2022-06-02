// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

//We can import directly from GitHub to get the price aggregator interface - this also gives us the ABI.
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

//Libraries are similar to contracts
//Library methods must have the internal view modifier on them
//They can be called in the main contract on the type that they return, in this code its uint256.
library PriceConverter {
    function getPrice(AggregatorV3Interface priceFeed)
        internal
        view
        returns (uint256)
    {
        //The aggregator's latestRoundData() function returns several different variables, however we are only interested in price.
        //You can add a comma in place of the variables you don't wish to store.
        //(uint80 roundID, int price, uint startedAt, uint timeStamp, uint80 answeredInRound) becomes (,int price,,,)
        //We can explicity say int256 in place of int because int defaults to int256
        (, int256 price, , , ) = priceFeed.latestRoundData();

        //We are typecasing int256 price to uint256 because this is a large number
        return uint256(price * 1e10); // 1**10
    }

    function getConversationRate(
        uint256 ethAmount,
        AggregatorV3Interface priceFeed
    ) internal view returns (uint256) {
        uint256 ethPrice = getPrice(priceFeed); //Get the price of eth in USD
        uint256 ethAmountInUsd = (ethAmount * ethPrice) / 1e18; //Returns in amount specified in USD
        return ethAmountInUsd;
    }
}

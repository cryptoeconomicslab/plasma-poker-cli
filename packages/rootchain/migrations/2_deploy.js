var Poker = artifacts.require("./Poker.sol");

module.exports = function(deployer) {
  deployer.deploy(Poker);
};
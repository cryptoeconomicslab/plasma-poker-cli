const { injectInTruffle } = require('sol-trace');
injectInTruffle(web3, artifacts);

const {
  Block,
  Transaction,
  TransactionOutput,
  BufferUtils
} = require('@cryptoeconomicslab/plasma-chamber')

const utils = require('ethereumjs-util');
const { increaseTime } = require('openzeppelin-solidity/test/helpers/increaseTime');
const RLP = require('rlp');

contract('Poker', function ([]) {


  
})
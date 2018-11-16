const {
    Transaction,
    TransactionOutput
} = require('@cryptoeconomicslab/plasma-chamber')
const utils = require('ethereumjs-util')

const ChildChainApi = require('../helpers/childchain.js')
const PlasmaWallet = require('../helpers/wallet.js')

const childChainApi = new ChildChainApi(process.env.CHILDCHAIN_ENDPOINT || 'http://localhost:3000');

const BN = utils.BN


const WEB3_CONNECTED = 'WEB3_CONNECTED';
const FETCH_BLOCK_NUMBER = 'FETCH_BLOCK_NUMBER';
const FETCH_BLOCK = 'FETCH_BLOCK';
const UPDATE_UTXO = 'UPDATE_UTXO';
const DEPOSITED = 'DEPOSITED';
const SEND_RAW_TRANSACTION = 'SEND_RAW_TRANSACTION';

const RootChainArtifacts = require('../assets/RootChain.json')

const RootChainAddress = process.env.ROOTCHAIN_ADDRESS || '0x345ca3e014aaf5dca488057592ee47305d9b3e10';
const OperatorAddress = process.env.OPERATOR_ADDRESS || '0x627306090abab3a6e1400e9345bc60c78a8bef57';

module.exports.web3connect = async function() {
  const wallet = new PlasmaWallet();
  await wallet.initWeb3().then(_=> wallet )
}

module.exports.fetchBlockNumber = function () {
return (dispatch, getState) => {
    childChainApi.request('eth_blockNumber').then((blockNumber) => {
    dispatch({
        type: FETCH_BLOCK_NUMBER,
        payload: blockNumber.result
    });
    })
};
}

module.exports.deposit = function deposit() {
  return (dispatch, getState) => {
    const web3 = getState().wallet.web3;
    var rootChainContract = new web3.eth.Contract(
      RootChainArtifacts.abi,
      RootChainAddress
    );
    web3.eth.getAccounts().then((accounts) => {
      return rootChainContract.methods.deposit(
        OperatorAddress
      ).send({
        from: accounts[0],
        gas: 200000,
        value: new BN("100000000000000000")
      })
    }).then(function(error, result) {
      console.log("deposit: ", error, result);
      dispatch({
        type: DEPOSITED,
        payload: {}
      });
    });
  };
}

module.exports.fetchBlock = function(blkNum) {
  if(typeof blkNum == 'string') {
    blkNum = Number(blkNum);
  }
  return (dispatch, getState) => {
    return childChainApi.getBlockByNumber(blkNum).then((block) => {
      const transactions = block.result.txs.map(tx => {
        return Transaction.fromBytes(new Buffer(tx, 'hex'));
      });
      dispatch({
        type: FETCH_BLOCK,
        payload: {
          txs: transactions
        }
      });
    })
  };
}

module.exports.updateUTXO = function() {
  return (dispatch, getState) => {
    const wallet = getState().wallet;
    wallet.update().then(utxos => {
      console.log('utxos', utxos);
      dispatch({
        type: UPDATE_UTXO,
        payload: utxos
      });
    })
  };
}


module.exports.transfer = function(utxo, toAddress) {
  toAddress = new Buffer(toAddress, 'hex');
  return (dispatch, getState) => {
    const wallet = getState().wallet;
    const input = new TransactionOutput(
      utxo.owners,
      utxo.value.map(s=>parseInt(s)),
      utxo.state,
      utxo.blkNum
    );
    wallet.getHistory(PlasmaWallet.getUTXOKey(input)).then(history => {
      console.log('we should send history to receiver.', history);
    });
    const output = new TransactionOutput(
      [toAddress],
      utxo.value.map(s=>parseInt(s)),
      [0]
    );
    const tx = new Transaction(
      0,
      [toAddress],
      new Date().getTime(),
      [input],
      [output]
    );
    const sign = wallet.sign(tx);
    tx.sigs.push(sign);
    // include sigunatures
    let txBytes = tx.getBytes(true);

    const data = txBytes.toString('hex');
    return childChainApi.sendRawTransaction(data).then(transactionHash => {
      console.log("sendRawTransaction: ", transactionHash);
      dispatch({
        type: SEND_RAW_TRANSACTION,
        payload: transactionHash
      });
    });
  };
}
  
module.exports.sendRawTransaction = function() {
  return (dispatch, getState) => {
    const web3 = getState().wallet.web3Child;

    const input = new TransactionOutput(
      [testAddress1],
      0
    );
    const output = new TransactionOutput(
      [testAddress2],
      0
    );
    const tx = new Transaction(
      0,
      [testAddress2],
      new Date().getTime(),
      [input],
      [output]
    );
    const sign = tx.sign(privKey1)
    tx.sigs.push(sign);
    // include sigunatures
    let txBytes = tx.getBytes(true);

    const data = txBytes.toString('hex');
    return web3.eth.sendSignedTransaction(data).then(transactionHash => {
      console.log("sendRawTransaction: ", transactionHash);
      dispatch({
        type: SEND_RAW_TRANSACTION,
        payload: transactionHash
      });
    });
  };
}
  
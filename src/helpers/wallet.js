const Web3 = require('web3')
const {
  Block,
  Transaction,
  TransactionOutput
} = require('@cryptoeconomicslab/plasma-chamber')
const RLP = require('rlp')
const ChildChainApi = require('../helpers/childchain')
const { Storage, BigStorage } = require('./storage')
const utils = require( 'ethereumjs-util')

/**
 * Plasma wallet store UTXO and proof
 */
class PlasmaWallet {
  constructor() {
    this.childChainApi = new ChildChainApi(process.env.CHILDCHAIN_ENDPOINT || 'http://localhost:3000');
    // what we have
    this.utxos = Storage.load('utxo') || {};
    this.latestBlockNumber = 0;
    this.loadedBlockNumber = Storage.load('loadedBlockNumber') || 0;
    // privKey is Buffer
    this.privKey = null;
    // address is hex string and checksum address
    this.address = null;
    this.zeroHash = utils.sha3(0).toString('hex');
  }

  getAddress() {
    return this.address;
  }

  async initWeb3() {
    const privateKeyHex = await Storage.load('privateKey') || 'c87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3';
    this.privKey = new Buffer(privateKeyHex, 'hex');
    const web3 = new Web3(new Web3.providers.HttpProvider(
      process.env.CHILDCHAIN_ENDPOINT || 'http://localhost:3000'
    ));
    const web3Root = new Web3(new Web3.providers.HttpProvider(
      process.env.ROOTCHAIN_ENDPOINT || 'http://localhost:8545'
    ));
    const address = utils.privateToAddress(this.privKey);
    web3Root.eth.defaultAccount = utils.bufferToHex(address);
    web3Root.eth.accounts.wallet.add(utils.bufferToHex(this.privKey));
    this.web3 = web3Root;
    this.web3Child = web3;
    this.address = utils.toChecksumAddress(utils.bufferToHex(address));
    return Promise.resolve();
  }

  /**
   * @dev update UTXO and proof.
   */
  update() {
    return this.childChainApi.getBlockNumber().then((blockNumber) => {
      this.latestBlockNumber = blockNumber.result;
      let tasks = [];
      for(let i = this.loadedBlockNumber + 1;i <= this.latestBlockNumber;i++) {
        tasks.push(this.childChainApi.getBlockByNumber(i));
      }
      return Promise.all(tasks);
    }).then((responses) => {
      responses.map(this.updateBlock.bind(this));
      this.updateLoadedBlockNumber(this.latestBlockNumber);
      return this.getUTXOArray();
    });
  }

  updateBlock(res) {
    const block = res.result;
    const transactions = block.txs.map(tx => {
      return Transaction.fromBytes(new Buffer(tx, 'hex'));
    });
    const filterOwner = (o) => {
      const r = o.owners.map(ownerAddress => {
        return utils.toChecksumAddress(ownerAddress);
      });
      return r.indexOf(this.address) >= 0;
    };
    transactions.reduce((acc, tx) => {
      return acc.concat(tx.inputs);
    }, []).filter(filterOwner).forEach((spentUTXO) => {
      const key = spentUTXO.hash();
      console.log('delete', spentUTXO.blkNum, block.number, spentUTXO.value);
      delete this.utxos[key];
    });
    let newTx = {};
    transactions.forEach(tx => {
      tx.outputs.filter(filterOwner).forEach(utxo => {
        // TODO: fix
        utxo.blkNum = block.number;
        const key = utxo.hash(block.number);
        this.utxos[key] = utxo.getBytes(block.number).toString('hex');
        newTx[key] = tx.getBytes().toString('hex');
        console.log('insert', block.number, utxo.value);
      });
    });
    // getting proof
    Object.keys(this.utxos).forEach(key => {
      const proof = this.calProof(block, TransactionOutput.fromTuple(RLP.decode(Buffer.from(this.utxos[key], 'hex'))));
      if(newTx.hasOwnProperty(key)) {
        // inclusion
        this.bigStorage.add(
          key,
          block.number,
          proof,
          newTx[key]
        );
      }else{
        // non-inclusion
        this.bigStorage.add(
          key,
          block.number,
          proof,
          this.zeroHash
        );
      }
    });
    Storage.store('utxo', this.utxos);
  }

  calProof(blockJson, utxo) {
    const block = new Block(blockJson.number);
    const transactions = block.txs.map(tx => {
      return Transaction.fromBytes(new Buffer(tx, 'hex'));
    });
    transactions.forEach(tx => {
      block.appendTx(tx);
    });
    return block.createTXOProof(utxo).toString('hex');
  }

  getHistory(utxoKey) {
    return this.bigStorage.searchProof(utxoKey);
  }

  /**
   * @dev sign transaction by private key
   * @param {Transaction} tx
   */
  sign(tx) {
    return tx.sign(this.privKey);
  }

  /**
   * @dev generate key from UTXO
   * @param {TransactionOutput} data 
   */
  static getUTXOKey(data) {
    if(data.owners && data.value && data.state && data.blkNum) {
      return utils.sha3(JSON.stringify(data)).toString('hex');
    }else{
      throw new Error('invalid UTXO');
    }
  }

  updateLoadedBlockNumber(n) {
    this.loadedBlockNumber = n;
    Storage.store('loadedBlockNumber', this.loadedBlockNumber);
  }

  getUTXOArray() {
    return Object.keys(this.utxos).map(k => {
      return TransactionOutput.fromTuple(RLP.decode(Buffer.from(this.utxos[k], 'hex')));
    });
  }
}

module.exports = PlasmaWallet
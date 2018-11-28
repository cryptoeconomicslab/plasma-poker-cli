const Web3 = require('web3')
const {
  BaseWallet,
  Block,
  Transaction,
  TransactionOutput
} = require('@cryptoeconomicslab/chamber-core')
const ChildChainApi = require('../helpers/childchain')
const { Storage, BigStorage } = require('./storage')
const utils = require('ethereumjs-util')

const WALLET_MODE_UNKNOWN = 0;
const WALLET_MODE_METAMASK = 1;
const WALLET_MODE_MOBILE = 2;

/**
 * Plasma wallet store UTXO and proof
 */
class PlasmaWallet extends BaseWallet {
  constructor() {
    super({
      storage: Storage,
      bigStorage: BigStorage
    });
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
    this.mode = WALLET_MODE_UNKNOWN;
  }

  getAddress() {
    return this.address;
  }

  initWeb3() {
    const privateKeyHex = Storage.load('privateKey') || 'c87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3';
    this.privKey = new Buffer(privateKeyHex, 'hex');
    this.mode = WALLET_MODE_MOBILE;
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
    this.setAddress(utils.toChecksumAddress(utils.bufferToHex(address)));
    return {
      web3Root: web3Root,
      web3Child: web3Root,
      address: address
    };
  }

  /**
   * @dev update UTXO and proof.
   */
  update() {
    return this.childChainApi.getBlockNumber().then((blockNumber) => {
      this.latestBlockNumber = blockNumber;
      let tasks = [];
      for(let i = this.loadedBlockNumber + 1;i <= this.latestBlockNumber;i++) {
        tasks.push(this.childChainApi.getBlockByNumber(i));
      }
      return Promise.all(tasks);
    }).then((responses) => {
      responses.map(res => {
        const block = res.result
        this.updateBlock(Block.fromString(JSON.stringify(block)))
      });
      this.updateLoadedBlockNumber(this.latestBlockNumber);
      return this.getUTXOs();
    });
  }

  getHistory(utxoKey) {
    return BigStorage.searchProof(utxoKey);
  }

  /**
   * @dev sign transaction by private key
   * @param {Transaction} tx
   */
  async sign(tx) {
    if(this.mode == WALLET_MODE_METAMASK) {
      const accounts = await this.web3.eth.getAccounts();
      return await this.web3.eth.sign(utils.bufferToHex(tx.hash()), accounts[0]);
    }else{
      return tx.sign(this.privKey);
    }
  }

  /**
   * @dev generate key from UTXO
   * @param {TransactionOutput} data 
   */
  static getUTXOKey(data) {
    if(data.owners && data.value && data.state && data.hasOwnProperty('blkNum')) {
      return utils.sha3(JSON.stringify(data)).toString('hex');
    }else{
      throw new Error('invalid UTXO');
    }
  }

  updateLoadedBlockNumber(n) {
    this.loadedBlockNumber = n;
    Storage.store('loadedBlockNumber', this.loadedBlockNumber);
  }

  /*
  * ROOT UTILS
  * */
  async getRootNetwork(){
    return await this.web3.eth.net.getNetworkType()
  }
  async getRootBalance(){
    let balance = await this.web3.eth.getBalance(this.address)
    return this.web3.utils.fromWei(balance, 'ether')
  }
}

module.exports = PlasmaWallet

const Web3 = require('web3')
const {
  Transaction,
  TransactionOutput
} = require('@cryptoeconomicslab/chamber-core')
const {
  BaseWallet
} = require('@cryptoeconomicslab/chamber-wallet')
const { Storage, BigStorage } = require('./storage')
const utils = require('ethereumjs-util')

const WALLET_MODE_UNKNOWN = 0;
const WALLET_MODE_METAMASK = 1;
const WALLET_MODE_MOBILE = 2;

const RootChainArtifacts = require('../assets/RootChain.json')


/**
 * Plasma wallet store UTXO and proof
 */
class PlasmaWallet extends BaseWallet {
  constructor() {
    super({
      storage: Storage,
      bigStorage: BigStorage,
      rootChainAddress: process.env.ROOTCHAIN_ADDRESS || '0x345ca3e014aaf5dca488057592ee47305d9b3e10'
    });
    // what we have
    this.utxos = Storage.load('utxo') || {};
    // privKey is Buffer
    this.privKey = null;
    // address is hex string and checksum address
    this.address = null;
    this.zeroHash = utils.sha3(0).toString('hex');
    this.mode = WALLET_MODE_UNKNOWN;
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
    this.setAddress(utils.toChecksumAddress(utils.bufferToHex(address)));
    this.setPrivateKey(this.privKey);
    this.setWeb3(web3Root);
    this.setWeb3Child(web3);
    const rootChainContract = new web3.eth.Contract(
      RootChainArtifacts.abi,
      this.rootChainAddress
    )
    this.setRootChainContract(rootChainContract);
    return {
      web3Root: web3Root,
      web3Child: web3Root,
      address: address
    };
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

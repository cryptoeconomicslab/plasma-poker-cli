const randomBytes = require('randombytes')
const utils = require('ethereumjs-util')
const { Storage } = require('./storage')
const {
  Transaction,
  TransactionOutput
} = require('@cryptoeconomicslab/chamber-core')
const MqttClient = require('./mqtt')
const EventEmitter = require('events')

class Integration extends EventEmitter {

  constructor() {
    super()
    this.mqttClient = new MqttClient();
    this.mqttClient.on('message', e => {
      this.emit('message', {
        topic: e.topic,
        message: e.message
      })
    })
    this.mqttClient.subscribe('rooms')
  }

  /**
   * @description generate hash chain and return last hash
   * @param {Buffer} preimage 
   * @param {Integer} num 
   */
  static hashchain(preimage, num) {
    const h = utils.sha3(preimage);
    if(num <= 1) {
      return h
    } else {
      return Integration.hashchain(h, num - 1)
    }
  }

  /**
   * publish infomations needed for making multisig
   * @param {String} roomName 
   * @param {TransactionOutput} utxo 
   */
  async sendMultisigInfo(roomName, utxo) {
    const preimage = randomBytes(16)
    await Storage.store('preimage', utils.bufferToHex(preimage))
    const hash = Integration.hashchain(preimage, 10)
    this.mqttClient.publish('rooms', {
      roomName: roomName,
      utxo: utils.bufferToHex(utxo.getBytes()),
      hash: utils.bufferToHex(hash)
    });
  }

  async createMultisigPhase1(wallet, utxo1, utxo2, hash1) {
    // Alice's utxo
    const input1 = utxo1
    // Bob's utxo
    const input2 = utxo2
    const preimage = randomBytes(16)
    await Storage.store('preimage', utils.bufferToHex(preimage))
    const hash2 = Integration.hashchain(preimage, 10)
    
    const output = new TransactionOutput(
      [input1.owners[0], input2.owners[0]],
      [input1.value[0], input2.value[0]]
      [12/*porker commit label*/, hash1, hash2]
    );

    const tx = new Transaction(
      12, /*porker commit label*/
      [hash1, hash2],
      new Date().getTime(),
      [input1, input2],
      [output]
    );
    const sig = wallet.sign(tx);
    tx.sigs.push(sig)
    mqttClient.publish(targetName, {
      txBytes: utils.bufferToHex(tx.getBytes(true)),
      sig: utils.bufferToHex(sig)
    });
  }

  async signMultisig(wallet, childChainApi, tx) {
    const sig = wallet.sign(tx)
    tx.sigs.push(sig)
    const data = tx.getBytes().toString('hex')
    return await childChainApi.sendRawTransaction(data)
  }

  async createMultisigPhase2(wallet, tx, merkleRoot) {
    const confsig = wallet.confirmationSign(tx, merkleRoot)
    this.mqttClient.publish(targetName, {
      confsig: utils.bufferToHex(confsig)
    });
  }

  async reveal1() {
    const preimage = await Storage.load('preimage')

  }

  reveal2() {

  }

  reveal3() {

  }

}

module.exports = Integration

const randomBytes = require('randombytes')
const utils = require('ethereumjs-util')
const { Storage } = require('./storage')
const {
  Transaction,
  TransactionOutput
} = require('@cryptoeconomicslab/plasma-chamber')
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

  static nHash(p, n) {
    const h = utils.sha3(p);
    if(n <= 1) {
      return h
    } else {
      return Integration.nHash(h, n - 1)
    }
  }

  async sendMultisigInfo(roomName, utxo) {
    const preimage = randomBytes(16)
    await Storage.store('preimage', utils.bufferToHex(preimage))
    const hash = Integration.nHash(preimage, 10)
    this.mqttClient.publish('rooms', {
      roomName: roomName,
      utxo: utils.bufferToHex(utxo.getBytes()),
      hash: utils.bufferToHex(hash)
    });
  }

  async createMultisigPhase1(wallet, utxo1, utxo2, hash1, hash2) {
    // Alice's utxo
    const input1 = utxo1
    // Bob's utxo
    const input2 = utxo2
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

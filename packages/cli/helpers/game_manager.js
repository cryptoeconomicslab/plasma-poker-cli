const chalk = require('chalk');
const figlet = require('figlet');
const inquirer = require('inquirer')
const prompts = require('prompts')
const Card = require("./../helpers/card")
const { sleep } = require("./../helpers/animation")
const _ = require("lodash")
const utils = require('ethereumjs-util')
const { Storage } = require("./../helpers/storage")
const Integration = require('./sdk')

const {
  fetchBlockNumber,
  fetchBlock,
  updateUTXO,
  deposit,
  transfer
} = require('./../actions')

class GameManager {
  constructor(wallet, web3Root, web3Child, address){
    this.wallet = wallet
    this.web3Root = web3Root
    this.web3Child = web3Child
    this.address = address
    this.sdk = new Integration();
    this.sdk.on('message', (e) => {
      if(e.topic == 'rooms') {
        this.addRoom(e.message)
      }
    })
  }

  async renderTitle(){
    console.log(
      chalk.yellow(figlet.textSync("Welcome", { horizontalLayout: 'full' }))
    );
    console.log(
      chalk.yellow(figlet.textSync("to", { horizontalLayout: 'full' }))
    );
    console.log(
      chalk.yellow(figlet.textSync("Plasma", { horizontalLayout: 'full' }))
    );
    console.log(
      chalk.yellow(figlet.textSync("Poker", { horizontalLayout: 'full' }))
    );
  }

  async renderMeta(){
    let { wallet, web3Root, web3Child, address } = this

    let currentBlockHeight = await fetchBlockNumber(wallet)
    let network = await wallet.getRootNetwork()
    let rootchainBalance = await wallet.getRootBalance()
    let pokerBalance = wallet.getBalance()
  
    console.log(chalk.red(`Current Block Height is: ${currentBlockHeight}`))
    console.log(chalk.green(`You're in: ${network}`))
    console.log(chalk.green(`Your rootchain balance: ${rootchainBalance}`))
    console.log(chalk.green(`Your poker balance: ${pokerBalance}`))
  }

  async renderMainmenu(){
    let opts = [
      "Transfer to Plasma Chain",
      "Create Room",
      "Room List"
    ]
    let { item } = await inquirer.prompt([{
        type: 'list',
        name: 'item',
        message: 'Menu',
        choices: opts
    }])
    return { index: opts.indexOf(item), opts: opts }
  }

  async renderTransfer(){
    console.log('tr')
  }
  async renderRoomCreate(){
    const { roomname } = await prompts({
      type: 'text',
      name: 'roomname',
      message: 'What is the name of your room?',
      validate: roomname => {
        var bool = ""
        bool = roomname.length < 4 ? "Too short" : true
        return bool
      }
    });
    Storage.store(`room-${roomname}`, "")
    const utxos = await this.wallet.update()
    const utxo = utxos[0];
    if(utxo) {
      this.sdk.sendMultisigInfo(roomname, utxo);
    }else{
      // you have no utxo
    }
  }
  async renderRoomList(){
    let opts = await Storage.searchRooms()
    if(opts.length === 0) throw new Error("No rooms!")

    let { item } = await inquirer.prompt([{
      type: 'list',
      name: 'item',
      message: 'Room List',
      choices: opts
    }])
    return { index: opts.indexOf(item), opts: opts }

  }
  async renderGame(player1){
    await Storage.deleteRoom(player1)
    const { player2 } = await prompts({
      type: 'text',
      name: 'player2',
      message: 'What is your name?',
      validate: player2 => {
        var bool = ""
        bool = player2.length < 2 ? "Too short" : true
        return bool
      }
    });

    let { handsA, handsB } = this.fetchInitialHands()
    
    console.log(chalk.blue(player2))
    await sleep(3)
    Card.renderHands(handsB)

    
    // turn1
    let { newHands: newHands1, bitmap: bitmapB1 } = await this.renderDiscard(handsB, "")    
    Card.renderHands(newHands1)
    await sleep(2)
    newHands1 = await this.draw(newHands1, bitmapB1)
    Card.renderHands(newHands1)

    // turn2
    let { newHands: newHands2, bitmap: bitmapB2 } = await this.renderDiscard(newHands1, bitmapB1)    
    Card.renderHands(newHands2)
    await sleep(2)
    newHands2 = await this.draw(newHands2, bitmapB2)
    Card.renderHands(newHands2)

    // turn3
    let { newHands: newHands3, bitmap: bitmapB3 } = await this.renderDiscard(newHands2, bitmapB2)
    Card.renderHands(newHands3)
    await sleep(2)
    newHands3 = await this.draw(newHands3, bitmapB3)
    Card.renderHands(newHands3)

    return newHands3
  }

  async finalize(hands){
    let handsStr = hands.map(id=> Card.idToAsm(id) ).join("")
    let hash = utils.keccak256(handsStr.toString('utf8'))
    await sleep(2)
  }
  async fetchBothHands(){
    return this.fetchInitialHands()
  }
  async oddsCalculation(handsA, handsB){
    // In real scenario, this must be in the childchain and SDK
    Card.calc(handsA, handsB)
  }

  fetchInitialHands(){
    let handsA = []
    let handsB = []
  
    while(handsA.length < 5){
      handsA.push(Card.randomId())
      handsA = _.uniq(handsA)
    }
    while(handsB.length < 5){
      handsB.push(Card.randomId())
      handsB = _.uniq(handsB)
    }

    return { handsA: handsA, handsB: handsB }
  }

  async renderDiscard(handsB, bitmapBefore){
    if(handsB.length !== 5) throw new Error("Wrong hand length")
    if(handsB.indexOf(0) === -1) handsB.push(0) //pass
    let opts = handsB.map((id,i)=>{
      var card = (id===0) ? "Pass ✋" : Card.idToCard(id)
      return `${i+1}: ${card}`
    })

    let { item } = await inquirer.prompt([
      {
        type: 'checkbox',
        message: 'Discard?',
        name: 'item',
        choices: opts,
        validate: function(answer) {
          if (answer.length < 1) {
            return 'You must choose at least one card.';
          }
          return true;
        }
      }
    ])

    var discardedIndices = item.map(i=> parseInt(i.slice(0,1))-1 )
    var newHands = handsB
      .filter((h,i)=> discardedIndices.indexOf(i) === -1 )
      .filter(h=> h !== 0 )

    var bitmapArray = discardedIndices
      .map(i=> handsB[i] )
      .filter(h=> h !== 0 )

    bitmapArray = bitmapArray.concat(Card.bitmapToIds(bitmapBefore))


    return { newHands: newHands, bitmap: Card.idsToBitmap(bitmapArray) }
  }

  addRoom(message) {
    Storage.store(`room-${message.roomName}`, message)
  }

  async draw(hands, bitmap){
    let usedIds = Card.bitmapToIds(bitmap)

    let chanceCount = 5 - hands.length
    let newCards = []
    // in actual scenario, childchain will make this
    while(chanceCount > 0){
      var newCard = Card.randomId()
      if(
        hands.indexOf(newCard) === -1
        &&
        newCards.indexOf(newCard) === -1
        &&
        usedIds.indexOf(newCard) === -1
      ){
        newCards.push(newCard)
        chanceCount--
      }
    }
    return hands.concat(newCards)
  }
}

module.exports.GameManager = GameManager
const chalk = require('chalk');
const figlet = require('figlet');
const inquirer = require('inquirer')
const Card = require("./../helpers/card")
const _ = require("lodash")

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

    let currentBlockHeight = await fetchBlockNumber()
    let network = await wallet.getRootNetwork()
    let rootchainBalance = await wallet.getRootBalance()
    let utxos = wallet.getUTXOArray()
    let pokerBalance = utxos.length == 0 ? 0 : utxos.map(utxo=> utxo.value ).reduce((a,b)=> a+b )
  
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
    console.log('cr')
  }
  async renderRoomList(){
    let opts = [
      "Alice",
      "Carl",
      "Diane"
    ]
    let { item } = await inquirer.prompt([{
        type: 'list',
        name: 'item',
        message: 'Room List',
        choices: opts
    }])
    return { index: opts.indexOf(item), opts: opts }
  }
  async renderGame(player1,player2){
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
    
    console.log(chalk.red(`${player1}`))
    Card.renderHands(handsA)
    console.log(chalk.blue(`${player2}`))
    Card.renderHands(handsB)
  
    Card.calc(handsA, handsB)
  }

}


module.exports.GameManager = GameManager
const chalk = require('chalk');
const figlet = require('figlet');
const inquirer = require('inquirer')
const CLI = require('clui')
const Spinner = CLI.Spinner
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
  async renderGame(player1, player2){
    let { handsA, handsB } = this.fetchInitialHands()
    
    console.log(chalk.blue("You"))
    await sleep(3)
    Card.renderHands(handsB)

    
    var { newHands, bitmapB } = await this.renderDiscard(handsB)    
    await sleep(3)
    Card.renderHands(newHands)


    // Card.calc(handsA, handsB)
  }

  fetchInitialHands(){
    let handsA = []
    let handsB = []
  
    /* TODO: どう表現したらmockっぽい？
      ・自分はhashを自動でcommitしている
      ・相手がまだcommitしてないことがわかる
      ・相手がcommitしたらすぐにrevealする
      ・相手がrevealTxの雛形を送信してきてないことがわかる
      ・雛形がきたらすぐにrevealする
      ・revealがまだconfされていない状態がわかる
      ・confされたらすぐにfetchInitialHandsが実行されて自分の手札だけが見える
      ・自分の手札をfinalizeするか否かの選択肢が存在する
      ・finalizeを選んだら相手のcommitを待つ
      ・相手がcommitしたらすぐにcommit confを待つ
      ・commit confしたらrevealの雛形を待つ
      ・revealの雛形がきたらrevealTxしてreveal confを待つ
      ・reveal confがきたら互いの手札と勝敗をレンダリングする
    */

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

  async renderDiscard(handsB){
    let opts = handsB.map((id,i)=> `${i+1}: ${Card.idToCard(id)}` )
    let { item } = await inquirer.prompt([
      {
        type: 'checkbox',
        message: 'Discard?',
        name: 'item',
        choices: opts,
        validate: function(answer) {
          if (answer.length < 1) {
            return 'You must choose at least one topping.';
          }
          return true;
        }
      }
    ])

    var bitmapB = []
    var discardedIndices = item.map(i=> parseInt(i.slice(0,1))-1 )
    var newHands = handsB
      .filter((h,i)=> discardedIndices.indexOf(i) === -1 )
    var bitmapB = discardedIndices.map(i=> handsB[i] )
    return { newHands: newHands, bitmapB: bitmapB }
  }
}

async function sleep(i){
  return new Promise(async (resolve, reject) => {
    let countdown = new Spinner(`Exiting in ${i} seconds...  `, ['⣾','⣽','⣻','⢿','⡿','⣟','⣯','⣷']);
    countdown.start();
    let pid = setInterval(_=>{
      countdown.message(`Exiting in ${i} seconds...  `);
      if (i === 0) {
        process.stdout.write('\n');
        countdown.stop()
        clearInterval(pid)
        resolve()
      }
      i--;
    }
    , 1000)
  })

}


module.exports.GameManager = GameManager
require('dotenv').config()
const clear = require('clear');

const { web3connect } = require('./actions')
const { GameManager } = require("./helpers/game_manager")
const { sleep } = require("./helpers/animation")

async function main(){
  sleep(1) // without await, parallel
  let { wallet, web3Root, web3Child, address } = await web3connect()
  await wallet.update()

  const game = new GameManager(wallet, web3Root, web3Child, address)

  clear()

  await game.renderTitle()
  await game.renderMeta()
  var { index, opts } = await game.renderMainmenu()
  switch(index){
    case 0:
      game.renderTransfer()
    break;
    case 1:
      game.renderRoomCreate()
    break;
    case 2:
      var { index, opts } = await game.renderRoomList()
      let lastHands = await game.renderGame(opts[index])
      await game.finalize(lastHands)
      let { handsA } = await game.fetchBothHands()
      game.oddsCalculation(handsA, lastHands)
    break;
    default: 
      throw new Error("failed")
  }

}


main().then()


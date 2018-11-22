require('dotenv').config()
const clear = require('clear');

const { web3connect } = require('./actions')
const { GameManager } = require("./helpers/game_manager")

async function main(){
  let { wallet, web3Root, web3Child, address } = await web3connect()
  wallet.update()

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
      game.renderGame(opts[index], "Bob")
    break;
    default: 
      throw new Error("failed")
  }

}


main().then()


require('dotenv').config()

const {
  web3connect,
  fetchBlockNumber,
  fetchBlock,
  updateUTXO,
  deposit,
  transfer
} = require('./actions/index.js')

async function main(){
  let wallet = await web3connect()
  let currentBlockHeight = await fetchBlockNumber()
  console.log(currentBlockHeight)
}



main().then()


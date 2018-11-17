require('dotenv').config()

const {
  web3connect,
  fetchBlockNumber,
  fetchBlock,
  updateUTXO,
  deposit,
  transfer
} = require('./actions/index.js')

const chalk = require('chalk');
const clear = require('clear');
const figlet = require('figlet');

async function main(){
  let wallet = await web3connect()
  let currentBlockHeight = await fetchBlockNumber()
  clear();
  console.log(
    chalk.yellow(
      figlet.textSync(currentBlockHeight, { horizontalLayout: 'full' })
    )
  );
}



main().then()


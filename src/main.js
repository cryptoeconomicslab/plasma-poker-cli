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
  let { wallet, web3Root, web3Child, address } = await web3connect()
  wallet.update()

  let currentBlockHeight = await fetchBlockNumber()
  let network = await wallet.getRootNetwork()
  let rootchainBalance = await wallet.getRootBalance()
  let utxos = wallet.getUTXOArray()
  let pokerBalance = utxos.length == 0 ? 0 : utxos.map(utxo=> utxo.value ).reduce((a,b)=> a+b )

  clear();
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
  console.log(chalk.red(`Current Block Height is: ${currentBlockHeight}`))
  console.log(chalk.green(`You're in: ${network}`))
  console.log(chalk.green(`Your rootchain balance: ${rootchainBalance}`))
  console.log(chalk.green(`Your poker balance: ${pokerBalance}`))
  console.log(chalk.yellow(`Do you deposit to Plasma Poker?(Trustless)`))
  console.log(chalk.yellow(`Start new room`))
  console.log(chalk.yellow(`Join a existing room`))
  console.log(chalk.yellow(`See your history`))
}



main().then()


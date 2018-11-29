# Plasma Poker (CLI)

!!! Please carefully check your country's gamble license and legal condition. Mainnet deployment is by your own risk !!!

## Overview
- Plasma Prime based Poker.
- Made of the multisig Tx & commit-reveal Tx
- Exitgame's safety&liveness isn't investigated enough
  - Testnet launch is gonna be good step stone to find out the flaw

## Tech tips
- Childchain
  - Just a NodeJS server
- Rootchain
  - Plasma Prime contract that decides "which UTXO deserves exit"
- UI is consisted by these npm libs
  - chalk: CLI coloring
  - figlet: ASCII Arts generator
  - prompts: On-time Validator of CLI Prompt
  - inquirer: Arrow selections
  - clui: LoadingSpinner, TableView, BarGraph in CLI
  - clear: CLI resetter
  - minimist: Args parser
  - shelljs: Portable commands
- Card appearance
  - [A-D][0-13] is the expression of cards
  - This is exactly same as unicode naming
  - Unicode: https://en.m.wikipedia.org/wiki/Playing_cards_in_Unicode#Playing_cards_deck

### Getting Started

Please setup and launch Chamber.
https://github.com/cryptoeconomicslab/plasma-chamber

```
yarn install
yarn start
```


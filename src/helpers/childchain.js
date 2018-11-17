const axios = require('axios')

class ChildChainApi {
    constructor(endpoint) {
      this.id = 1;
      this.endpoint = endpoint;
    }
  
    async getBlockNumber() {
      let res = await this.request('eth_blockNumber')
      return res.result;
    }
  
    getBlockByNumber(blockNumber) {
      return this.request('eth_getBlockByNumber', [blockNumber]);
    }
  
    sendRawTransaction(data) {
      return this.request('eth_sendRawTransaction', [data]);
    }
    
    async request(methodName, args) {
      this.id++;
      let res = await axios({
        method: 'POST',
        url: this.endpoint,
        headers: {
          'Content-Type': 'application/json'
        },    
        data: JSON.stringify({
          'jsonrpc': '2.0',
          'id': this.id,
          'method': methodName,
          'params': args
        })
      })
      return res.data
    }
  }
  
  module.exports = ChildChainApi
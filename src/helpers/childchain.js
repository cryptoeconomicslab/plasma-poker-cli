class ChildChainApi {
    constructor(endpoint) {
      this.id = 1;
      this.endpoint = endpoint;
    }
  
    getBlockNumber() {
      return this.request('eth_blockNumber');
    }
  
    getBlockByNumber(blockNumber) {
      return this.request('eth_getBlockByNumber', [blockNumber]);
    }
  
    sendRawTransaction(data) {
      return this.request('eth_sendRawTransaction', [data]);
    }
    
    request(methodName, args) {
      this.id++;
      return fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },    
        body: JSON.stringify({
          'jsonrpc': '2.0',
          'id': this.id,
          'method': methodName,
          'params': args
        })
      })
        .then(response => {
          return response.json();
        });
    }
  }
  
  module.exports = ChildChainApi
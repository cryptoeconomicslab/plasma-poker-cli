const { promisify } = require("util")
var { readFile, writeFile, readdir } = require("fs")
readFile = promisify(readFile)
writeFile = promisify(writeFile)
readdir = promisify(readdir)

function isJson(text){
  return (/^[\],:{}\s]*$/.test(text.replace(/\\["\\\/bfnrtu]/g, '@').
  replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').
  replace(/(?:^|:|,)(?:\s*\[)+/g, '')))
}

const Storage = {
  store: async function(key, item) {
    return await writeFile(`data/${key}`, JSON.stringify(item))
  },

  load: async function(key) {
    let res = await readFile(`data/${key}`)
    return isJson(res) ? JSON.parse(res) : res
  }
}


const BigStorage = {
  add: async function(utxoKey, blkNum, proof, txBytes){
    let data = JSON.stringify({
      id: utxoKey + '.' + blkNum,
      utxoKey: utxoKey,
      blkNum: blkNum,
      proof: proof,
      txBytes: txBytes
    })
    return await Storage.store(`proof__${utxoKey}__${blkNum}`, data)
  },
  searchProof: async function(utxoKey){
    let files = await readdir("data")
    let utxoKeysWithBlkNum = files.filter(file=>{
      return file.indexOf(`proof__${utxoKey}`) > 0
    })
    return utxoKeysWithBlkNum.map(async k=> await Storage.load(k) )
  }
}

module.exports.Storage = Storage
module.exports.BigStorage = BigStorage

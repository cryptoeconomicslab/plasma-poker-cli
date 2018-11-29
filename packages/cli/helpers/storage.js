const { promisify } = require("util")
const fs = require("fs")

function isJson(text){
  return text.length > 0 ?
    (/^[\],:{}\s]*$/.test(text.replace(/\\["\\\/bfnrtu]/g, '@').
  replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').
  replace(/(?:^|:|,)(?:\s*\[)+/g, '')))
  :
    false
}

class Storage {
  static store(key, item) {
    var res = false;
    try {
      fs.writeFileSync(`data/${key}`, JSON.stringify(item))
      res = true
    } catch(e){
      console.error(e)
      res = false
    }
    return res
  }

  static load(key) {
    var res = null;
    try {
      res = (fs.readFileSync(`data/${key}`)).toString()
      res = isJson(res) ? JSON.parse(res) : null
    } catch(e){
      let rootFiles = fs.readdirSync("./")
      if(rootFiles.includes("package.json") && rootFiles.includes("data")){
        fs.writeFileSync(`data/${key}`, "")
      } else if(!rootFiles.includes("data")) {
        fs.mkdirSync("data")
      } else {
        console.error("load failed, not in root")
      }
      console.error(e)
    }
    return res
  }
}


const BigStorage = {
  add: function(utxoKey, blkNum, proof, txBytes){
    let data = JSON.stringify({
      id: utxoKey + '.' + blkNum,
      utxoKey: utxoKey,
      blkNum: blkNum,
      proof: proof,
      txBytes: txBytes
    })
    return Storage.store(`proof__${utxoKey}__${blkNum}`, data)
  },
  searchProof: function(utxoKey){
    let files = fs.readdir("data")
    let utxoKeysWithBlkNum = files.filter(file=>{
      return file.indexOf(`proof__${utxoKey}`) > 0
    })
    return utxoKeysWithBlkNum.map(k => Storage.load(k) )
  }
}

module.exports.Storage = Storage
module.exports.BigStorage = BigStorage

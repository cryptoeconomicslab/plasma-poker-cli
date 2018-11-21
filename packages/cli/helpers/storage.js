const { promisify } = require("util")
var { readFile, writeFile, readdir, mkdir } = require("fs")
readFile = promisify(readFile)
writeFile = promisify(writeFile)
readdir = promisify(readdir)
mkdir = promisify(mkdir)

function isJson(text){
  return text.length > 0 ?
    (/^[\],:{}\s]*$/.test(text.replace(/\\["\\\/bfnrtu]/g, '@').
  replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').
  replace(/(?:^|:|,)(?:\s*\[)+/g, '')))
  :
    false
}

const Storage = {
  store: async function(key, item) {
    var res = false;
    try {
      await writeFile(`data/${key}`, JSON.stringify(item))
      res = true
    } catch(e){
      console.error(e)
      res = false
    }
    return res
  },

  load: async function(key) {
    var res = null;
    try {
      res = (await readFile(`data/${key}`)).toString()
      res = isJson(res) ? JSON.parse(res) : res
    } catch(e){
      let rootFiles = await readdir("./")
      if(rootFiles.includes("package.json") && rootFiles.includes("data")){
        await writeFile(`data/${key}`, "")
      } else if(!rootFiles.includes("data")) {
        await mkdir("data")
      } else {
        console.error("load failed, not in root")
      }
      console.error(e)
    }
    return res
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

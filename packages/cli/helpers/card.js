mod = {}
const HANDS_PATH = '/tmp/hands.png'
const chalk = require('chalk');
const { CardGroup, OddsCalculator } = require('poker-odds-calculator')


mod.idToAbst = function(id){
  let suits = ['♠','♥','♦','♣']
  let nums = ['K','A','2','3','4','5','6','7','8','9','10','J','Q']
  let sIndex = Math.floor((id-1)/13)
  let nIndex = id%13
  var s = suits[sIndex]
  var n = nums[nIndex]
  return {s:s,n:n}
}
mod.idToCard = function(id){
  var {s,n} = mod.idToAbst(id)
  n = n.padStart(2, " ")

  if(s=='♥'||s=='♦'){
    s = chalk.bgWhite.red(s)
    n = chalk.bgWhite.red(n)
  } else {
    s = chalk.inverse(s)
    n = chalk.inverse(n)
  }

  return `${s}${n}`
}
mod.idToAsm = function(id){
  let suits = ['s','h','d','c']
  let nums = ['K','A','2','3','4','5','6','7','8','9','T','J','Q']
  let sIndex = Math.floor((id-1)/13)
  let nIndex = id%13
  var s = suits[sIndex]
  var n = nums[nIndex]
  return `${n}${s}`
}

mod.calc = function(idsA, idsB){
  const blk = 10000
  const blkHex = ((blk).toString(16)+"").padStart(32, "0")

  const player1Cards = CardGroup.fromString(idsA.map(i=> mod.idToAsm(i)+blkHex ).join(" "));
  const player2Cards = CardGroup.fromString(idsB.map(i=> mod.idToAsm(i)+blkHex ).join(" "));
  const result = OddsCalculator.calculate([player1Cards, player2Cards], []);
  let aRank = result.handranks[0]
  let bRank = result.handranks[1]
  var winner = ""
  if(aRank.compareTo(bRank) == 1 && bRank.compareTo(aRank) == -1){
    winner = "Alice"
  } else if(aRank.compareTo(bRank) == -1 && bRank.compareTo(aRank) == 1) {
    winner = "Bob"
  } else if(aRank.compareTo(bRank) == 0 && bRank.compareTo(aRank) == 0) {
    winner = "None"
  } else {
    throw new Error("compareTo() func is broken")
  }
  result.duplicationLog.records.map(r=>{
    let who = r.who == 0 ? chalk.red("Alice") : chalk.blue("Bob") 
    let src = mod.idToCard(r.srcCard.toId())
    let dest = mod.idToCard(r.destCard.toId())
    let newHands = r.newHands.map(c=> mod.idToCard(c.toId()) ).join(" ")
    console.log("[Duplication]")
    console.log(who)
    console.log(`${newHands} (diff: ${src} => ${dest})`)


    /*
    * DEBUG
    * */
    var dupcheckHands = ""
    if(r.who == 0){
      dupcheckHands = idsB.map(i=> mod.idToAsm(i) )
    } else {
      dupcheckHands = idsA.map(i=> mod.idToAsm(i) )
    }
    if(dupcheckHands.indexOf(dest.toString()) !== -1){
      // if shuffling person gets duplication again
      require("fs").writeFileSync(`./data/log/duplog${Date.now()}`, `
      [Init]
      Alice: ${idsA.map(i=> mod.idToAsm(i) ).join(" ")}
      Bob: ${idsB.map(i=> mod.idToAsm(i) ).join(" ")}
      [Result]
      Alice: ${aRank.toString()} - rank: ${aRank.getRank()}
      Bob: ${bRank.toString()} - rank: ${bRank.getRank()}
      winner: ${winner}
      [Duplication]
      ${who}
      ${newHands} (diff: ${r.srcCard.toString()} => ${r.destCard.toString()})
      `)
    }
    
  })

  console.log(`Alice: ${aRank.toString()} - rank: ${aRank.getRank()}`);
  console.log(`Bob: ${bRank.toString()} - rank: ${bRank.getRank()}`);
  console.log(`winner: ${winner}`)
}

mod.renderHands = function(hands){
  let str = hands.map(h=> mod.idToCard(h) ).join("  ")
  console.log(str)
}

mod.randomId = function(){
  let r = Math.floor(Math.random()*52)
  return (r==0) ? mod.randomId() : r
}

// mod.visualize = async function(){
//   const mergeImg = require("merge-img")
//   let img = await mergeImg([
//     imgpath("1F0A3"),
//     imgpath("1F0AE"),
//     imgpath("1F0A1"),
//     imgpath("1F0D9"),
//     imgpath("1F0C3")
//   ],
//     {direction:true, offset: 50}
//   )
//   img.write(HANDS_PATH, _=>{
//     renderRealCard(HANDS_PATH)
//   })
// }

// mod.imgpath = function(name){
//   let mainFilePathArray = require.main.filename.split("/")
//   mainFilePathArray.pop()
//   let rootdir = mainFilePathArray.join("/")
//   return `${rootdir}/assets/cards/${name}.png` 
// }
  
//  mod.renderRealCard = function(absPath){
//   var fs = require('fs');
//   var pictureTube = require('picture-tube')
//   var tube = pictureTube();
//   tube.pipe(process.stdout);
//   fs.createReadStream(absPath).pipe(tube);
// }
  



module.exports = mod
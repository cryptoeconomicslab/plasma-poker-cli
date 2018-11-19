mod = {}
const HANDS_PATH = '/tmp/hands.png'
const chalk = require('chalk');
const { CardGroup, OddsCalculator } = require('poker-odds-calculator')


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

mod.idToAbst = function(id){
  let suits = ['♠','♥','♦','♣']
  let nums = ['K','A','2','3','4','5','6','7','8','9','10','J','Q']
  let sIndex = Math.floor((id-1)/13)
  let nIndex = id%13
  var s = suits[sIndex]
  var n = nums[nIndex]
  return {s:s,n:n}
}

mod.abstToAsm = function(abst){
  var {s,n} = abst

  switch(s){
    case '♠':
      s = 's'
    break;
    case '♥':
      s = 'h'
    break;
    case '♦':
      s = 'd'
    break;
    case '♣':
      s = 'c'
    break;
  }
  if(n==10){
    n = 'T'
  }

  return `${n}${s}`

}

mod.calc = function(idsA, idsB){
  const player1Cards = CardGroup.fromString(idsA.map(i=> mod.abstToAsm(mod.idToAbst(i))).join(""), "Alice", Date.now());
  const player2Cards = CardGroup.fromString(idsB.map(i=> mod.abstToAsm(mod.idToAbst(i)) ).join(""), "Bob", Date.now());
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

mod.visualize = async function(){
  const mergeImg = require("merge-img")
  let img = await mergeImg([
    imgpath("1F0A3"),
    imgpath("1F0AE"),
    imgpath("1F0A1"),
    imgpath("1F0D9"),
    imgpath("1F0C3")
  ],
    {direction:true, offset: 50}
  )
  img.write(HANDS_PATH, _=>{
    renderRealCard(HANDS_PATH)
  })
}

mod.imgpath = function(name){
  let mainFilePathArray = require.main.filename.split("/")
  mainFilePathArray.pop()
  let rootdir = mainFilePathArray.join("/")
  return `${rootdir}/assets/cards/${name}.png` 
}
  
 mod.renderRealCard = function(absPath){
  var fs = require('fs');
  var pictureTube = require('picture-tube')
  var tube = pictureTube();
  tube.pipe(process.stdout);
  fs.createReadStream(absPath).pipe(tube);
}
  



module.exports = mod
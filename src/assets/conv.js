const {mv} = require("shelljs")




for(var i=1; i<=55; i++){
  var sIndex = Math.floor((i-1)/13)
  var number = i%13
  if(sIndex === 4) {
    if(number === 1){
      sIndex = 0
      number = 0
    } else if(number === 2){
      sIndex = 2
      number = 0
    } else if(number === 3){
      sIndex = 3
      number = 0
    }
  } else if (number === 10) {
    number = "A"    
  } else if (number === 11) {
    number = "B"    
  } else if (number === 12) {
    number = "D"    
  } else if (number === 0) {
    number = "E"    
  }

  let suits = ["A", "B", "C", "D"]

  // trump-sandbox is coming from src keynote file.
  let src = `./cards/trump-sandbox.0${(i+"").padStart(2, '0')}.png`
  let dest = `./cards/1F0${suits[sIndex]}${number}.png`
  


  console.log(src,dest)

  mv(src, dest)
}


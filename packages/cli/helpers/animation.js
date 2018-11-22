const CLI = require('clui')
const Spinner = CLI.Spinner

async function sleep(i){
  return new Promise(async (resolve, reject) => {
    let countdown = new Spinner(`Subscribing blockchain`, ['◜','◠','◝','◞','◡','◟']);
    countdown.start();
    let pid = setInterval(_=>{
      if (i === 0) {
        process.stdout.write('\n');
        countdown.stop()
        clearInterval(pid)
        resolve()
      }
      i--;
    }
    , 1000)
  })
}

module.exports.sleep = sleep
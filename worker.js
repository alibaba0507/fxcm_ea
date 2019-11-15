let rep = require('./repository');
let fs = require('fs');
let candles = require('./fxcm_data');
let storeKey = require('./repository').storeKey;
var cron = require('node-cron');

async function updateCandles  (){
    let trading = rep.store.get(storeKey.trading);
    if (!trading) { return; }
    trading = JSON.parse(trading);
    //let loadPairs = store.get(rep.storeKey.trading);
    //loadPairs = JSON.parse(loadPairs);
    candles.subscibe();
    await candles.sleep(5000);
    for (let i = 0;i < trading.length;i++)
    {
        await candles.loadCandles(i);
    }
   
}


async function updateSotreParams () {
    try {
  
      let savedPairs = fs.readFileSync('pairs.txt').toString();
  
      if (savedPairs && savedPairs != '') {
        savedPairs = JSON.parse(savedPairs);
        rep.store.set(storeKey.trading, savedPairs.trading);
        rep.store.set(storeKey.minLots, (savedPairs.minLots));
        rep.store.set(storeKey.maxLots, (savedPairs.maxLots));
        console.log(' =========== UPDATE STORE WITH TRADE PAIRS AND LOTS ======', savedPairs);
        //fs.writeFileSync('pairs.txt', JSON.stringify(savedPairs));
        //updatePairs(true);// unsubscribe
      }
  
    } catch (e) {
      console.log(' >>>> ERROR GET updateSotreParams ', e);
    }
  }

  var task = cron.schedule('* * * * *', () => {
    let savedPairs = fs.readFileSync('pairs.txt').toString();
    console.log(' >>>>> PING SERVER EVERY 1 MIN WORKER ....>>>>>');
     //updateCandles();
    if ((new Date().getMinutes() % 5) == 0) { updateCandles(); }
  });

  // Load pair parameters
  
   updateSotreParams();
   updateCandles();
 // task.start();
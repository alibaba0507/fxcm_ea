let rep = require('./repository');
let fs = require('fs');
let candles = require('./fxcm_data');
let storeKey = require('./repository').storeKey;
var cron = require('node-cron');
let utils = require('./utils');
let ords = require('./fxcm_orders');
let indic = require('./fxcm_indic');

async function updateCandles  (){
    let trading = rep.store.get(storeKey.trading);
    if (!trading) { return; }
    trading = JSON.parse(trading);
    //let loadPairs = store.get(rep.storeKey.trading);
    //loadPairs = JSON.parse(loadPairs);
   
   /*
    for (let i = 0;i < trading.length;i++)
    {
        await candles.loadCandles(i,rep.candlesCount);
        await utils.sleep(500);
    }
    await utils.sleep(2000);
    
    console.log(" >>>>>>> $$$$$ BEOFRE SUPSCRIBE TO PRICE &&&&&&& ");
    candles.subscibe();
    //await ords.updateOpenPositions();
    //await utils.sleep(5000);
    //ords.subscibeOpenPosition();
    await utils.sleep(2000);
    console.log(" >>>>>>>>>> BEFORE MACD >>>>>>>>");
    await macd();
    */
   //rep.mail('FXCM Test mail',"<b> This is is a test");
}


async function macd ()
{
  try{
    let trading = rep.store.get(storeKey.trading);
    loadPairs = JSON.parse(trading);
    console.log(loadPairs);
    for (let i = 0;i < loadPairs.length;i++)
    {
      let candles = rep.store.get(loadPairs[i].pair);
      candles = JSON.parse(candles);
      console.log(" >>>>>>> CANDLES LEN[" + candles.length + "]  >>>>>>");

      let macd = await indic.calcMACDRange(candles,500,0);

      if (macd)
      {
        console.log(" ####### MACD [" + loadPairs[i].pair + "]######### ",macd);
      }
    }// end for
}catch (e)
{
  console.log(e.stack);
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
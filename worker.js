let rep = require('./repository');
let fs = require('fs');

let rep = require('./repository');
let storeKey = require('./repository').storeKey;

async function updateCandles  (){
    let trading = rep.store.get(storeKey.trading);
    if (!trading) { return; }
    trading = JSON.parse(trading);
    //let loadPairs = store.get(rep.storeKey.trading);
    //loadPairs = JSON.parse(loadPairs);
    trading.forEach(element => {
        
    });
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

  // Load pair parameters
  await updateSotreParams();

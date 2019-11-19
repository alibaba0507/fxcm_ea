let indic = require('./fxcm_indic');
let data = require('./fxcm_data');
let rep = require('./repository');
let ords = require('./fxcm_orders');


module.exports.updateOrders = async ()=>{
  let trading = rep.store.get(storeKey.trading);
  loadPairs = JSON.parse(trading);
  console.log(loadPairs);
  let arraySig = [];
  for (let i = 0;i < loadPairs.length;i++)
  {
    let candles = rep.store.get(loadPairs[i].pair);
    candles = JSON.parse(candles);
    let s = await this.macd_siganal(candles,500);
    arraySig.push({"pair":loadPairs[i].pair,s});
  }
  if (arraySig.length > 0)
  {
    await ords.updateOpenPositions();// collect all the open orders
    let openOrders = rep.store.get(rep.storeKey.open_possitions);
    if (openOrders) 
    {
      openOrders = JSON.parse(openOrders);
      
    }
  }

}
module.exports.macd_siganal = async (candles,cnt,startFrom = 0, tf = 5)=>{
  
 // data.convertCandlesByTime();
  if (candles.length < (cnt + startFrom))
   {return {"error":"candles[" + candles.length + "] smaller than range[" + (cnt+startFrom) + "]"};}
  
  let close = Number(candles[1][rep.candleParams.BidClose]);
  let open  = Number(candles[1][rep.candleParams.BidOpen]);
  let hi  = Number(candles[1][rep.candleParams.BidHigh]);
  let low  = Number(candles[1][rep.candleParams.BidLow]);
  let ma = await indic.ma(candles,12);
  let res = await indic.calcMACDRange(candles,cnt,startFrom,tf);
  
  let oldTF = chooseNextTimeFrame(tf);
  let biasMacd = await indic.calcMACDRange(candles,cnt,startFrom,oldTF);
  while (Number(biasMacd.bias) == -1)
  {
    let newTF = chooseNextTimeFrame(oldTF);
    if (newTF == oldTF)
     break;
    biasMacd = await indic.calcMACDRange(candles,cnt,startFrom,newTF);
   oldTF = newTF;
  }
  let res = {};
  res.bias = biasMacd.bias;
  if (Number(biasMacd.bias) == 1)
  { // buy bias
    if (Number(res.macd.main[1]) > Number(res.top_macd) * 1.32 && 
        close < open && hi > Number(ma[0]) && low < Number(ma[0]))
        {
          res.closeOrder = 1;
           return res;
        }else if (Number(res.macd.main[1]) < Number(res.top_macd) * 0.62 && 
          close > open && hi > Number(ma[0]) && low < Number(ma[0]))
          {
            res.openOrder = 1;
           return res;
          } 
  }
  if (Number(biasMacd.bias) == 0)
  { // sell bias
    if (Number(res.macd.main[1])  < 0 && Number(res.macd.main[1])*(-1) > Number(res.bottom_macd) * 1.32 && 
        close > open && hi > Number(ma[0]) && low < Number(ma[0]))
        {
          res.closeOrder = 0;
           return res;
        }else 
         if (((Number(res.macd.main[1])  < 0 && Number(res.macd.main[1])*(-0.62) > Number(res.bottom_macd)) 
              || Number(res.macd.main[1]) > 0) 
          && close < open && hi > Number(ma[0]) && low < Number(ma[0]))
        {
          res.closeOrder = 0;
           return res;
        }
  }
  return;
}

async function chooseNextTimeFrame(tf)
{
  if (tf == 5)
   return 15;
  if (tf == 15)
   return 30;
  if (tf == 30)
    return 60;
  if (tf == 60)
   return 240;
  if (tf == 240)
   return 1440;
  return tf;
}
let indic = require('./fxcm_indic');
let data = require('./fxcm_data');
let rep = require('./repository');
let ords = require('./fxcm_orders');


module.exports.updateOrders = async ()=>{
  let trading = rep.store.get(rep.storeKey.trading);
  loadPairs = JSON.parse(trading);
  console.log(loadPairs);
  let arraySig = [];
  for (let i = 0;i < loadPairs.length;i++)
  {
    let candles = rep.store.get(loadPairs[i].pair);
    candles = JSON.parse(candles);
    let s = await this.macd_siganal(candles,500);
    arraySig.push({"pair":loadPairs[i].pair,"macd":s});
  }
  if (arraySig.length > 0)
  {
    await ords.updateOpenPositions();// collect all the open orders
    for (let i = 0;i < arraySig.length;i++)
    {
      if (arraySig[i].macd.bias == 1)
      { // we hava buy signal
        if (arraySig[1].macd.closeOrder == 1)
        {
          
        }
      }
    }
  }

}

module.exports.macd_bias = async (candles,cnt,startFrom = 0, tf = 5) =>{
  let count = cnt + (cnt*0.5);
  if (count > candles.length-1)
  {
    let oldTf = tf;
    tf = await chooseNextTimeFrame(tf);
    if (oldTf == tf)
     return {"bias":-1};
    return await this.macd_bias(candles,500,startFrom,tf);
  }
  let biasMacd = await indic.calcMACDRange(candles,count,startFrom,tf);
  let oldTF = await chooseNextTimeFrame(tf);
  if (biasMacd.bias == -1 && oldTF != tf)
   return await this.macd_bias(candles,count,startFrom,tf);
  console.log(" >>>>> MACD BIAS [" + candles.length + "][" + count + "]TF["  +tf + "]>>>>>>");
  return biasMacd;
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
  
  /*
  let oldTF = tf;//chooseNextTimeFrame(tf);
  let biasMacd = await indic.calcMACDRange(candles,cnt,startFrom,oldTF);
  let count = cnt;
  let prevTF = oldTF;
  while (Number(biasMacd.bias) == -1)
  {
    count += (cnt*0.5);
    if (count + startFrom > candles.length - 1 /*|| (count / cnt) > 5* /)
      break;
    //oldTF = chooseNextTimeFrame(oldTF);
    console.log(" >>>>> MACD BIAS [" + oldTF  + "][" + count + "] >>>>>>");
    biasMacd = await indic.calcMACDRange(candles,count,startFrom,oldTF);
    //oldTF = chooseNextTimeFrame(oldTF);
    //if (prevTF == oldTF)
    // break;
    //prevTF = oldTF;
  }*/
  let biasMacd = res;
  if (biasMacd.bias == -1)
  {
    biasMacd = await this.macd_bias(candles,cnt,startFrom,tf);
  }
  let result = {};
  result.bias = biasMacd.bias;
 // if (Number(biasMacd.bias) == 1)
 // { // buy bias
    if (Number(res.macd.main[1]) > Number(res.top_macd) * 1.32 && 
        close < open && hi > Number(ma[0]) && low < Number(ma[0]))
        {
          result.closeOrder = 1;
           return result;
        }else if (Number(res.macd.main[1]) < Number(res.top_macd) * 0.62 && 
          close > open && hi > Number(ma[0]) && low < Number(ma[0])
             && Number(biasMacd.bias) == 1)
          {
            result.openOrder = 1;
           return result;
          } 
  //}
  //if (Number(biasMacd.bias) == 0)
  //{ // sell bias
    if (Number(res.macd.main[1])  < 0 && Number(res.macd.main[1])*(-1) > Number(res.bottom_macd) * 1.32 && 
        close > open && hi > Number(ma[0]) && low < Number(ma[0]))
        {
          result.closeOrder = 0;
           return result;
        }else 
         if ( Number(res.macd.main[1]) > Number(res.bottom_macd)*(-0.62) 
          && close < open && hi > Number(ma[0]) && low < Number(ma[0])
            && Number(biasMacd.bias) == 0)
        {
          result.openOrder = 0;
           return result;
        }
  //}
  return result;
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
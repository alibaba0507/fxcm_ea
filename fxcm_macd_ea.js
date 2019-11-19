let indic = require('./fxcm_indic');
let data = require('./fxcm_data');
let rep = require('./repository');
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
  if (Number(biasMacd.bias) == 1)
  { // buy bias
    if (res.macd.main[1] > res.top_macd * 1.32 && 
        close < open && hi > Number(ma[0]) && low < Number(ma[0]))
        {

        }
  }
  if (Number(biasMacd.bias) == 0)
  { // sell bias
    if (res.macd.main[1] > res.top_macd * 1.32 && 
        close < open && hi > Number(ma[0]) && low < Number(ma[0]))
        {
          
        }
  }
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
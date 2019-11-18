"use strict";

module.exports.sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
  }


  module.exports.convertCandlesByTime = async (candles, time = 15)=>{
    let tfCandles = [];
    let candleIndx = [];
    if (Array.isArray(candles)) {
      for (var i = 0; i < candles.length; i++) {
        let d = new Date(Number(candles[i][0]) * 1000);
       
        if (i == 0  
            || d.getMinutes() == time 
              || d.getMinutes() == 0 
                || (d.getMinutes() > time 
                && d.getMinutes()%time == 0 ))
        {
          if (candleIndx.length > 0)
          {
           candleIndx[rep.candleParams.BidClose] = candles[i][rep.candleParams.BidClose];
           candleIndx[rep.candleParams.AskClose] = candles[i][rep.candleParams.AskClose];
           tfCandles.push(candleIndx);
          }
          candleIndx = candles[i];
        }else{
          if (Number(candleIndx[rep.candleParams.AskHigh]) < 
                Number(candles[i][rep.candleParams.AskHigh]))
            {
              candleIndx[rep.candleParams.BidHigh] = candles[i][rep.candleParams.BidHigh];
              candleIndx[rep.candleParams.AskHigh] = candles[i][rep.candleParams.AskHigh];
            }
            if (Number(candleIndx[rep.candleParams.BidLow]) > 
                Number(candles[i][rep.candleParams.BidLow]))
            {
              candleIndx[rep.candleParams.BidLow] = candles[i][rep.candleParams.BidLow];
              candleIndx[rep.candleParams.AskLow] = candles[i][rep.candleParams.AskLow];
            }
        }// end else
          
      }// end for 
    }
    return tfCandles;
  }
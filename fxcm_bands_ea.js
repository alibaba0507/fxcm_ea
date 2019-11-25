let indic = require('./fxcm_indic');
let rep = require('./repository');

module.exports.band_siganal = async (candles)=>{
    let ma12 = await indic.ma(candles,12);
    let ma50 = await indic.ma(candles,50);
    let ma100 = await indic.ma(candles,100);
    let ma200 = await indic.ma(candles,200);
    let band = await indic.bands(candles,ma12,12);
    let cnt = 0;
    let type = -1;
    // we bust find trand
    for (let i = 0; i < candles.length;i++)
    {
       if (band.lower[i] > ma200[i]){
        if (/*ma50[i] > ma100[i] &&*/ ma50[i] > ma200[i]
             && Math.min(ma50[i],ma100[i]) < band.lower[i])
            {
                type = 1;
                break;
            }
      
       }// end if
       if (band.upper[i] < ma200[i]){
        if (/*ma50[i] < ma100[i] &&*/ ma50[i] < ma200[i]
             && Math.max(ma50[i],ma100[i]) > band.upper[i])
            {
                type = 0;
                break;
            }
      
       }// end if
      
    }// end for
    let result = {"type":type}
    //if (type == 1 && Number(candles[1][rep.candleParams.BidLow]) < band.lower[1])
    //{
    //  result.signal = 1;
    //}

    //if (type == 0)
   // {
      if ( Number(candles[1][rep.candleParams.AskHigh]) > band.upper[1])
        result.signal = 0;
      if (Number(candles[1][rep.candleParams.BidLow]) < band.lower[1])
        result.signal = 1;

    //}
    return result;
}
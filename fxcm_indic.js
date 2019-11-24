let rep = require('./repository');

let utils = require('./utils');

/**
 * Will calculate some of indicators , for 
 * given time frame.
 */


 /**
  * @returns {macd:(array of macd{}),top_macd,bottom_macd,price_dist,bias}
  */
 module.exports.calcMACDRange = async (candles, cnt,startFrom = 0, tf =5) =>{
  if (tf != 5)
   candles = await utils.convertCandlesByTime(candles,tf); 
   candles.sort((a, b) => {
    return (b[0] - a[0]); // sort decending by time where newest time is first
  });
  let macd = await this.macd(candles);
  let avrg_max = 0;
  let avrg_min = 0;
  let min_cnt = 0;
  let max_cnt = 0;
  let max_pr = 0;
  let min_pr =0;
  for (let i = (cnt+startFrom);i > startFrom;i--)
  {
    if (Number(macd.main[i]) > 0)
    {
      avrg_max += Number(macd.main[i]);
      max_cnt ++;
      max_pr += Number(candles[i][rep.candleParams.BidClose]);
    }
    if (Number(macd.main[i]) < 0)
    {
      avrg_min += Number(macd.main[i])*(-1);
      min_cnt ++;
      min_pr += Number(candles[i][rep.candleParams.AskClose]);
    }
  }// end for
  let res = {"macd":macd};
  if (max_cnt>0)
  {
    res.top_macd = (avrg_max / max_cnt);
    max_pr /= max_cnt;
  }
  if (min_cnt > 0)
  {
   res.bottom_macd = (avrg_min/min_cnt);
   min_pr /= min_cnt;
  }
  if (min_pr > 0 && max_pr > 0)
   res.price_dist = Math.max(min_pr,max_pr) - Math.min(min_pr,max_pr);
  
  res.bias = -1;
   if (res.top_macd != 0 && res.bottom_macd != 0)
   {
    if(res.top_macd > res.bottom_macd && (res.bottom_macd/res.top_macd) < 0.8)
      res.bias = 1;
    if(res.top_macd < res.bottom_macd && (res.top_macd/res.bottom_macd) < 0.8)
    res.bias = 0; 
   }

   return res;
} 
 
 /**
 * Calculate MACD
 * @returns based on @param returBuffer = 0 LineBiffer , 1 = SignalBuffer , 3 = HistogramBuffer
 */
 module.exports.macd = async (candles,FastMAPeriod = 12,SlowMAPeriod = 26,SignalMAPeriod = 9)=>{
    let pos=candles.length-SlowMAPeriod;
    let SignalLineBuffer = new Array(candles.length).fill(0);
    let MACDLineBuffer  = new Array(candles.length).fill(0);
    let HistogramBuffer = new Array(candles.length).fill(0);
    let alpha = 2.0 / (Number(SignalMAPeriod) + 1.0);
        let alpha_1 = 1.0 - Number(alpha);
    for( let i=pos; i>=0; i--)
        {
        //  MACDLineBuffer[i] = iMA(NULL,0,FastMAPeriod,0,MODE_EMA,PRICE_CLOSE,i) - iMA(NULL,0,SlowMAPeriod,0,MODE_EMA,PRICE_CLOSE,i);
        let emaFast =  await ema(candles,FastMAPeriod);
        let emaSlow =  await ema(candles,SlowMAPeriod);
        MACDLineBuffer[i] = Number(emaFast[i])
                        -  Number(emaSlow[i]);
        SignalLineBuffer[i] = alpha*Number(MACDLineBuffer[i])  
                                + alpha_1*Number(SignalLineBuffer[i+1]);
        HistogramBuffer[i] = Number(MACDLineBuffer[i]) - Number(SignalLineBuffer[i]);
        }
        return {"main":MACDLineBuffer,"signal":SignalLineBuffer,"hist":HistogramBuffer};
       /*
        if (returBuffer == 0)
          return MACDLineBuffer;
        if (returBuffer == 1)
          return SignalLineBuffer;
        if (returBuffer == 2)
          return HistogramBuffer;
        */
    }



/**
 * Moving Averege.
 */
module.exports.ma = async (candles,ma = 200) =>{  

    let sum=0;
    let i = 1
    let pos=candles.length-ma-1;
    let MABuffer = new Array(candles.length).fill(0);
    candles.sort((a, b) => {
      return (b[0] - a[0]); // sort decending by time where newest time is first
    });
 //---- initial accumulation
    if(pos<ma) pos=ma;
    for(i=1;i<ma;i++,pos--)
    {
      let c = Number(candles[pos][rep.candleParams.BidClose]) 
         + (Number(candles[pos][rep.candleParams.AskClose])
         - Number(candles[pos][rep.candleParams.BidClose]))*0.5;
       sum+=c; // BidClose , 6 - AskClose
    }
    //---- main calculation loop
    while(pos>=0)
      {
        let c = Number(candles[pos][rep.candleParams.BidClose]) 
             + (Number(candles[pos][rep.candleParams.AskClose])
                - Number(candles[pos][rep.candleParams.BidClose]))*0.5; 
        let c1 = Number(candles[pos+ma-1][rep.candleParams.BidClose]) 
                + (Number(candles[pos+ma-1][rep.candleParams.AskClose])
                   - Number(candles[pos+ma-1][rep.candleParams.BidClose]))*0.5; 
       sum+=c;
       MABuffer[pos]=sum/ma;
        sum-=c1;
         pos--;
      }
      
      /*
      console.log(' ######### END MA Period ' + ma + ' ###########');
      console.log(' MA [' +Number(MABuffer[0]) + '][' 
                      + new Date(Number(candles[0][0])*1000).toUTCString() 
                      + '] ');//+Point;);
     console.log(' MA [' +Number(MABuffer[1]) + '][' 
                      + new Date(Number(candles[1][0])*1000).toUTCString()
                      + ']');
     console.log(' MA [' +Number(MABuffer[2]) + '][' 
                      + new Date(Number(candles[2][0])*1000).toUTCString() 
                       +  ']');
     console.log(' MA [' +Number(MABuffer[3]) + '][' 
                      + new Date(Number(candles[3][0])*1000).toUTCString()
                       +  ']');
    */
    return MABuffer;
}

/**
 * @param candles array of o,h,l,c prices
 * @param maPeriodAsArray array of ma that form devitioan bands 
 * @param deviation 
 * @param maPeriod
 */
module.exports.bands = async (candles,maPeriodAsArray,InpBandsDeviations,maPeriod) =>{
  let i = 1
  let pos=candles.length-1;
  let ExtUpperBuffer = new Array(candles.length).fill(0);
  let ExtLowerBuffer = new Array(candles.length).fill(0);
  let ExtMABuffer = new Array(candles.length).fill(0);
  let ExtStdDevBuffer = new Array(candles.length).fill(0);
  candles.sort((a, b) => {
    return (b[0] - a[0]); // sort decending by time where newest time is first
  });

  for (let i = 0;i < pos;i++)
  {
    ExtMABuffer[i] = maPeriodAsArray[i];
    ExtStdDevBuffer[i]=this.StdDev_Func(i,candles,ExtMABuffer,maPeriod);
    //--- upper line
    ExtUpperBuffer[i]=ExtMABuffer[i]+InpBandsDeviations*ExtStdDevBuffer[i];
    //--- lower line
    ExtLowerBuffer[i]=ExtMABuffer[i]-InpBandsDeviations*ExtStdDevBuffer[i];
  }

  return {"upper":ExtUpperBuffer,"lower":ExtLowerBuffer,"ma":ExtMABuffer};
  
}

async function StdDev_Func (position,candles,maArray,period){
  let StdDev_dTmp=0.0;
  if(position>=period)
     {
      for(let i=0; i<period; i++)
        StdDev_dTmp+= Math.pow(candles[position-i]-maArray[position],2);
      StdDev_dTmp=Math.sqrt(StdDev_dTmp/period);
     }
  return(StdDev_dTmp);
}
    /**
     * Calculate exponetial moving averiges (ema)
     * @param {*} candles - Array of candles  
     * @param {*} ma - Moving Avereges period
     */
async function ema (candles,ma = 200) 
{  
   let pr=2.0/(Number(ma)+1);
    let sum=0;
    let i = 1
    let pos=candles.length-Number(ma)-2;
    let MABuffer = new Array(candles.length).fill(0);
 //---- initial accumulation
    if(pos<ma) pos=ma;
    //---- main calculation loop
    while(pos>=0)
      {
        let c = Number(candles[pos][rep.candleParams.BidClose]) 
             + (Number(candles[pos][rep.candleParams.AskClose])
                - Number(candles[pos][rep.candleParams.BidClose]))*0.5;
        let c1 = Number(candles[pos+1][rep.candleParams.BidClose]) 
                + (Number(candles[pos+1][rep.candleParams.AskClose])
                   - Number(candles[pos+1][rep.candleParams.BidClose]))*0.5;
        if(pos==(candles.length-Number(ma)-2)) 
          MABuffer[pos+1]=c1;
        MABuffer[pos]=c
                  *pr+Number(MABuffer[pos+1])*(1-pr);
       
         pos--;
      }
      
      /*
      console.log(' ######### END MA Period ' + ma + ' ###########');
      console.log(' MA [' +Number(MABuffer[0]) + '][' 
                      + new Date(Number(candles[0][0])*1000).toUTCString() 
                      + '] ');//+Point;);
     console.log(' MA [' +Number(MABuffer[1]) + '][' 
                      + new Date(Number(candles[1][0])*1000).toUTCString()
                      + ']');
     console.log(' MA [' +Number(MABuffer[2]) + '][' 
                      + new Date(Number(candles[2][0])*1000).toUTCString() 
                       +  ']');
     console.log(' MA [' +Number(MABuffer[3]) + '][' 
                      + new Date(Number(candles[3][0])*1000).toUTCString()
                       +  ']');
    */
    return MABuffer;
}



/**
 * Will calculate some of indicators , for 
 * given time frame.
 */


 /**
 * Calculate MACD
 * @returns based on @param returBuffer = 0 LineBiffer , 1 = SignalBuffer , 3 = HistogramBuffer
 */
 module.exports.macd = async (candles,FastMAPeriod = 12,SlowMAPeriod = 26,SignalMAPeriod = 9
    ,returBuffer = 0)=>{
    let pos=candles.length-SlowMAPeriod;
    let SignalLineBuffer = new Array(candles.length).fill(0);
    let MACDLineBuffer  = new Array(candles.length).fill(0);
    let HistogramBuffer = new Array(candles.length).fill(0);
    let alpha = 2.0 / (Number(SignalMAPeriod) + 1.0);
        let alpha_1 = 1.0 - Number(alpha);
    for( let i=pos; i>=0; i--)
        {
        //  MACDLineBuffer[i] = iMA(NULL,0,FastMAPeriod,0,MODE_EMA,PRICE_CLOSE,i) - iMA(NULL,0,SlowMAPeriod,0,MODE_EMA,PRICE_CLOSE,i);
        let emaFast =  ema(candles,FastMAPeriod);
        let emaSlow =  ema(candles,SlowMAPeriod);
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
     * Calculate exponetial moving averiges (ema)
     * @param {*} candles - Array of candles  
     * @param {*} ma - Moving Avereges period
     */
function ema (candles,ma = 200) 
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



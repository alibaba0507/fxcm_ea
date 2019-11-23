let rep = require('./repository');
const https = require("https");
const fetch = require("node-fetch");

/**
 * @param interval available are 1min, 5min, 15min, 30min, 60min, daily, weekly, monthly
 */
module.exports.macd = async (pair,interval='5min',period = 500,fastperiod=12,slowperiod=26,signalperiod=9)=>{
    try {
        let url = rep.config.alphavantage_proto + "://" 
                        +  rep.config.alphavantage_url + "function=" + rep.config.alphavantage_MACD 
                        + "&symbol=" + pair + "&interval=" + interval + "&series_type=open"
                        + "&apikey=" + rep.config.alphavantage_token;
        console.log(" >>>>>>>>>>>>>>>>>> CALLING URL [" + url + "] >>>>>>");
        const response = await fetch(url);
        const json = await response.json();
        const macd_inidic = json["Technical Analysis: MACD"];
        
        let macdArray = [];
        let signalArray = [];
        Object.keys(macd_inidic).forEach(function(k){
            //console.log(k + ' - ' + macd_inidic[k]);
            let o = Number(macd_inidic[k].MACD);
            let s = Number(macd_inidic[k].MACD_Signal);
            macdArray.push(o);
            signalArray.push(s);
            
           
        });
        

        /*
          if (o > 0)
            {
                top_cnt++;
                top_macd += o;
            }
            if (o < 0)
            {
                bottom_cnt++;
                bottom_macd+=o;
            }
        */
        return await this.macd_signal(macdArray,signalArray,period);


        //console.log(json);
      } catch (error) {
        console.log(error);
      }
    
}

/**
 * @returns  {"macd_top":avrg_top,"macd_bottom":avrg_bottom,"macd":macdArray[1]
    ,"ratio":ratio,"type":type(BUY OR SELL),"signal":(1 - close buy if buy > sell)
        (2 - open buy if (buy - sell) < maxLots)
        (3 - close sell if (sell) > buy )
        (4 - open SELL if (sell - buy) < maxLots)}
 */
module.exports.macd_signal = async (macdArray , sig,period = 500) =>
{
 try{
    let top_cnt = 0;
    let bottom_cnt = 0;
    let top_macd = 0;
    let bottom_macd = 0;
    
    for (let i = 0;i < period;i++)
    {
        if (Number(macdArray[i]) > 0)
        {
            top_cnt++;
            top_macd +=Number(macdArray[i]) ;
        }
        if (Number(macdArray[i])< 0)
        {
            bottom_cnt++;
            bottom_macd+=Number(macdArray[i]);
        }
    }
    let avrg_top = top_macd/top_cnt;
    let avrg_bottom = bottom_macd/bottom_cnt;
    let ratio = 0;
    let type = "NA";
    if (avrg_top > avrg_bottom*(-1))
    {  
        ratio =  avrg_bottom*(-1)/avrg_top;
        type = "BUY";
    }
    else
    {
            ratio =  avrg_top/avrg_bottom*(-1);
            type = "SELL";
    }
    if (ratio > 0.82)
      return await this.macd_signal(macdArray,sig,period + (period*0.5));
    
    if (macdArray[0] > avrg_top * 3 && macdArray[0] < sig[0] 
           && (macdArray[1] > sig[1] || macdArray[2] > sig[2]))
    {
        return {"macd_top":avrg_top,"macd_bottom":avrg_bottom,"macd":macdArray[1]
        ,"ratio":ratio,"type":type,"signal":1 
         , "msg":"close buy if buy > sell"}; // close buy if buy > sell
    }
    if (macdArray[0] < avrg_top && type == "BUY" && macdArray[0] > sig[0]
          && (macdArray[1] < sig[1] || macdArray[2]) < sig[2])
    {
        return {"macd_top":avrg_top,"macd_bottom":avrg_bottom,"macd":macdArray[1]
        ,"ratio":ratio,"type":type,"signal":2
         ,"msg":"open buy if (buy - sell) < maxLots"}; // open buy if (buy - sell) < maxLots 
    }
    if (macdArray[0] < avrg_bottom * 3 && macdArray[0] > sig[0]
          && (macdArray[1] > sig[1] || macdArray[2] > sig[2]))
    {
        return {"macd_top":avrg_top,"macd_bottom":avrg_bottom,"macd":macdArray[1]
        ,"ratio":ratio,"type":type,"signal":3
        ,"msg":"close sell if (sell) > buy"}; // close sell if (sell) > buy 
    }

    if (macdArray[0] > avrg_bottom && type == "SELL" && macdArray[0] < sig[0]
          && (macdArray[1] > sig[1] || macdArray[2] > sig[2]))
    {
        return {"macd_top":avrg_top,"macd_bottom":avrg_bottom,"macd":macdArray[1]
        ,"ratio":ratio,"type":type,"signal":4
     , "msg":"open SELL if (sell - buy) < maxLots"}; // open SELL if (sell - buy) < maxLots 
    }

    return {"macd_top":avrg_top,"macd_bottom":avrg_bottom,"macd":macdArray[1]
    ,"ratio":ratio,"type":type};
    
 }catch (e)
 {
     console.log(e.stack)
 }
}
module.exports.ma = async (pair)=>{

}
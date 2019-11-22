let rep = require('./repository');
const https = require("https");
const fetch = require("node-fetch");

/**
 * @param interval available are 1min, 5min, 15min, 30min, 60min, daily, weekly, monthly
 */
module.exports.macd = async (pair,fastperiod=12,slowperiod=26,signalperiod=9,interval='5min')=>{
    try {
        let url = rep.config.alphavantage_proto + "://" 
                        +  rep.config.alphavantage_url + "function=" + rep.config.alphavantage_MACD 
                        + "&symbol=" + pair + "&interval=" + interval + "&series_type=close"
                        + "&apikey=" + rep.config.alphavantage_token;
        console.log(" >>>>>>>>>>>>>>>>>> CALLING URL [" + url + "] >>>>>>");
        const response = await fetch(url);
        const json = await response.json();
        const macd_inidic = json["Technical Analysis: MACD"];
        let top_cnt = 0;
        let bottom_cnt = 0;
        let top_macd = 0;
        let bottom_macd = 0;
        let hasUpdated = false;
        let value = 0;
        Object.keys(macd_inidic).forEach(function(k){
            console.log(k + ' - ' + macd_inidic[k]);
            let o = Number(macd_inidic[k].MACD);
            if (hasUpdated)
            {
                hasUpdated = true;
                value = o;
            }
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
        });
        
        let avrg_top = top_macd/top_cnt;
        let avrg_bottom = bottom_macd/bottom_cnt;
        return {"macd_top":avrg_top,"macd_bottom":avrg_bottom,"macd":value};
        
        //console.log(json);
      } catch (error) {
        console.log(error);
      }
    
}

module.exports.ma = async (pair)=>{

}
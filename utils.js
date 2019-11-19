"use strict";

module.exports.sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
  }

/**
 * This function will order and sort Account 
 * orders
 * @param {*} acc_arr 
 * @param {*} pair 
 * @param {*} orderByIsBuy 
 * @param {*} orderByProfitPerLotBiggerThan 
 * @param {*} sortByOpenTime 
 */
  module.exports.sortAccOrders = async (acc_arr,pair,orderByIsBuy,orderByProfitPerLotBiggerThan,sortByOpenTime,sortByCloseTime)=>
  {
    let filterArray = new Array();
  orderByIsBuy = 
      (orderByIsBuy && orderByIsBuy == true)?1
      : (orderByIsBuy && orderByIsBuy == false)?0:orderByIsBuy;
  if (pair)
  {
    // filter by currency
    filterArray = acc_arr.filter((e)=>{ return (e.currency == pair)})
    if ((orderByIsBuy == 1 || orderByIsBuy == 0))
    {
      //console.log('Order By ',orderByIsBuy);
      //console.log('Order By ',(orderByIsBuy == 1));
      filterArray = filterArray.filter((e)=>{return ((orderByIsBuy == 1)?(e.isBuy === true):(e.isBuy === false));})
    }
    if (sortByOpenTime == true)
    {
      //console.log('>>>>> SORT BY OPEN Time >>>>>');
      filterArray.sort((a,b)=>{
      //  console.log('+++++++ [' + Number(a.time) + '] > [' + Number(b.time) + '] +++++++')
        return Number(b.time) - Number(a.time) 
      });
    }
    if (sortByCloseTime == true)
    {
      //console.log('>>>>> SORT BY OPEN Time >>>>>');
      filterArray.sort((a,b)=>{
      //  console.log('+++++++ [' + Number(a.time) + '] > [' + Number(b.time) + '] +++++++')
        return Number(b.closeTime) - Number(a.closeTime) 
      });
    }
    if (orderByProfitPerLotBiggerThan  && !isNaN(orderByProfitPerLotBiggerThan))
    {
     // console.log('++++++++++ ORDER BY PROFIT ++++ ');
      let copyArray = new Array();
       //(Number(e.visiblePL)/100) > Number(orderByProfitPerLotBiggerThan))
       let cnt = 0;
       let canCopy = false;
       filterArray.forEach((e)=>{
        if (/*(cnt==0 || canCopy)
               &&*/ (Number(e.grossPL)) >= Number(orderByProfitPerLotBiggerThan))
        {
          canCopy = true;
          copyArray.push(e);
       //   console.log('++++++++++ ORDER BY PROFIT ++++ [' + e.grossPL + '] >>>>>>');
        }
        cnt++;
       })
       filterArray = copyArray;
    } 
  }// end if(pair)
  return filterArray;
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
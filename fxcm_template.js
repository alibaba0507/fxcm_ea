let rep = require('./repository');
let ea = require('./fxcm_macd_ea');
let ords = require('./fxcm_orders');

module.exports.checkForEmailSignal = async () =>{
  let trading = rep.store.get(rep.storeKey.trading);
  loadPairs = JSON.parse(trading);
  console.log(loadPairs);
  let pairsToUpdate = [];
  for (let i = 0;i < loadPairs.length;i++)
  {
    let candles = rep.store.get(loadPairs[i].pair);
    candles = JSON.parse(candles);
    let s = await ea.macd_siganal(candles,500);
    if (s && (Object.prototype.hasOwnProperty.call(s, 'closeOrder')
            || Object.prototype.hasOwnProperty.call(s, 'openOrder')))
            {
              pairsToUpdate.push({"pair":loadPairs[i].pair,"macd":s});
            }
  }// end for
  if (pairsToUpdate.length > 0)
  { // we have a winner
    await ords.updateOpenPositions();
    

  }
}
/**
 *  @returns array of {
 *     "pair",
 *      "lots":{"pair","buy","sell"},
 *     "buy": {"pair":pair
 *              ,"ord":lastOrder{tradeId,orderId,accountName,currency,open,isBuy,amountK,grossPL,visiblePL}
 *              , "pips":diff
 *              ,"closestOrder":closestToCurrentPrice{tradeId,orderId,accountName,currency,open,isBuy,amountK,grossPL,visiblePL}
 *              ,"closestPips":clsPrDif}
 *      "sell": {"pair":pair
 *              ,"ord":lastOrder{tradeId,orderId,accountName,currency,open,isBuy,amountK,grossPL,visiblePL}
 *              , "pips":diff
 *              ,"closestOrder":closestToCurrentPrice{tradeId,orderId,accountName,currency,open,isBuy,amountK,grossPL,visiblePL}
 *              ,"closestPips":clsPrDif}
 *      "macd":{bias:{macd:(array of macd{}),top_macd,bottom_macd,price_dist,bias}
 *            ,"closeOrder":1 or 0
 *            ,"openOrder":1 or 0} 
 * }
 */
module.exports.createOrderTemplate = async () =>{
  let templateArrays = [];
  try{
    let trading = rep.store.get(rep.storeKey.trading);
    loadPairs = JSON.parse(trading);
    console.log(loadPairs);
    
    for (let i = 0;i < loadPairs.length;i++)
    {
      let candles = rep.store.get(loadPairs[i].pair);
      candles = JSON.parse(candles);
      let s = await ea.macd_siganal(candles,500);
      let lots = await ords.orderLots(loadPairs[i].pair);
      let ordBuy = await ords.lastOpenOrder(loadPairs[i].pair,true);
      let ordSell = await ords.lastOpenOrder(loadPairs[i].pair,false);
      templateArrays.push({"pair":loadPairs[i].pair
          , "bias":(s && typeof s.bias !== 'undefined' && s.bias !== null )? ( s.bias == 1?"BUY":s.bias == 0?"SELL":"NA"):"ERROR(NA)"
          , "lotsBuy":lots.buy,"lotsSell":lots.sell
              ,"lastBuy_tradeId":ordBuy.ord.tradeId
              ,"lastBuy_pips":ordBuy.pips
              ,"lastBuy_lots":ordBuy.ord.amountK
              ,"lastSell_trendId":ordSell.ord.tradeId
              ,"lastSell_pips":ordSell.pips
              ,"lastSell_lots":ordSell.ord.amountK
              ,"closeBuy_tradeId":ordBuy.closestOrder.tradeId
              ,"closeBuy_lots":ordBuy.closestOrder.amountK
              ,"closeBuy_pips":ordBuy.closestPips
              ,"closeSell_tradeId":ordSell.closestOrder.tradeId
              ,"closeSell_lots":ordSell.closestOrder.amountK
              ,"closeSell_pips":ordSell.closestPips
              ,"macd":s})
  }
    templateArrays.sort((a,b)=>{
      if(a.pair < b.pair) { return -1; }
      if(a.pair > b.pair) { return 1; }
      return 0;
  });
}catch (e)
{
  console.log(e.stack)
}finally{
 return templateArrays;
}
}
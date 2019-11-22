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
    let htmlEmailBody = "";
    let row = "";
    let rows = [];
   // await ords.updateOpenPositions();
    for (let i = 0;i < pairsToUpdate.length;i++)
    {
      let pair = pairsToUpdate[i].pair;
      let macd = pairsToUpdate[i].macd;
      let lots = await ords.orderLots(loadPairs[i].pair);
      let ordBuy = await ords.lastOpenOrder(loadPairs[i].pair,true);
      let ordSell = await ords.lastOpenOrder(loadPairs[i].pair,false);
      row = "";
      if (macd.bias == 1)
      { // buy trend so let c
        if (Object.prototype.hasOwnProperty.call(macd, 'closeOrder') && macd.closeOrder == 1 )
        {
          if (Number(lots.buy) > Number(lots.sell) 
            && Number(ordBuy.ord.grossPL) > (Number(ordBuy.ord.amountK)*1)
              /*check if ord prof > than $1 per lot*/)
              {
                row = "<td>" + loadPairs[i].pair + "</td>"
                  + "<td>BUY(BIAS) Close BUY Profit</td>"
                  + "<td><font color=\"green\">BUY(" + lots.buy + ")</font>--"
                  + " <font color=\"red\">SELL(" + lots.sell + ")</font></td>"
                  + "<td><font color=\"" + ((Number(ordBuy.pips) < 0)?"red":"green")  + "\">"
                  + parseFloat(ordBuy.pips).toFixed(5) + "</font>"
                  + "-- L("  +ordBuy.ord.amountK + ")&nbsp;&nbsp;&nbsp;&nbsp;"
                  + "<a href=\"" + rep.config.server_url + "/close?tradeId=" + ordBuy.ord.tradeId + "\">X</a> </td>"
                  + "<td><font color=\"" + ((Number(ordSell.pips) < 0)?"red":"green")  + "\">"
                  + parseFloat(ordSell.pips).toFixed(5) + "</font>"
                  + "-- L("  +ordSell.ord.amountK + ")&nbsp;&nbsp;&nbsp;&nbsp; </td>";

                  
              }
        }
        if (Object.prototype.hasOwnProperty.call(macd, 'openOrder') && macd.openOrder == 1 )
        {
          let lotDiff =Number(lots.buy) - Number(lots.sell); 
          let pipsDiff  = Number(ordBuy.ord.grossPL)  / Number(ordBuy.ord.amountK);
          if ( (lotDiff < rep.config.maxLot  
            && pipsDiff  < -2) ||(lotDiff < 0 && (pipsDiff > 2 || pipsDiff < -2)) 
              /*check if ord prof > than $1 per lot*/)
              {
                row = "<td>" + loadPairs[i].pair + "</td>"
                  + "<td>BUY(BIAS) Open BUY </td>"
                  + "<td><font color=\"green\">BUY(" + lots.buy + ")</font>--"
                  + " <font color=\"red\">SELL(" + lots.sell + ")</font></td>"
                  + "<td><font color=\"" + ((Number(ordBuy.pips) < 0)?"red":"green")  + "\">"
                  + parseFloat(ordBuy.pips).toFixed(5) + "</font>"
                  + "-- L("  +ordBuy.ord.amountK + ")&nbsp;&nbsp;&nbsp;&nbsp; </td>"
                  + "<td><font color=\"" + ((Number(ordSell.pips) < 0)?"red":"green")  + "\">"
                  + parseFloat(ordSell.pips).toFixed(5) + "</font>"
                  + "-- L("  +ordSell.ord.amountK + ")&nbsp;&nbsp;&nbsp;&nbsp;"
                  + "<a href=\"" + rep.config.server_url + "/close?tradeId=" + ordSell.ord.tradeId + "\">X</a><br>"
                  + "OR <font color=\"" + ((Number(ordSell.closestPips) < 0)?"red":"green")  + "\">"
                  + parseFloat(ordSell.closestPips).toFixed(5) + "</font>"
                  + "-- L("  +ordSell.closestOrder.amountK + ")&nbsp;&nbsp;&nbsp;&nbsp;"
                  + "<a href=\"" + rep.config.server_url + "/close?tradeId=" + ordSell.closestOrder.tradeId + "\">X</a></td>";
                  
              }
        }// end if (Object.prototype.hasOwnProperty.call(macd, 'openOrder') && macd.openOrder == 1 )
      }// end if (macd.bias == 1)
      // -------------- SELL --------------------
      if (macd.bias == 0)
      { // buy trend so let c
        if (Object.prototype.hasOwnProperty.call(macd, 'closeOrder') && macd.closeOrder == 0 )
        {
          if (Number(lots.buy) < Number(lots.sell) 
            && Number(ordSell.ord.grossPL) > (Number(ordSell.ord.amountK)*1)
              /*check if ord prof > than $1 per lot*/)
              {
                row = "<td>" + loadPairs[i].pair + "</td>"
                  + "<td>SELL(BIAS) Close SELL Profit</td>"
                  + "<td><font color=\"green\">BUY(" + lots.buy + ")</font>--"
                  + " <font color=\"red\">SELL(" + lots.sell + ")</font></td>"
                  + "<td><font color=\"" + ((Number(ordBuy.pips) < 0)?"red":"green")  + "\">"
                  + parseFloat(ordBuy.pips).toFixed(5) + "</font>"
                  + "-- L("  +ordBuy.ord.amountK + ")&nbsp;&nbsp;&nbsp;&nbsp; </td>"
                  + "<td><font color=\"" + ((Number(ordSell.pips) < 0)?"red":"green")  + "\">"
                  + parseFloat(ordSell.pips).toFixed(5) + "</font>"
                  + "-- L("  +ordSell.ord.amountK + ")&nbsp;&nbsp;&nbsp;&nbsp;"
                  + "<a href=\"" + rep.config.server_url + "/close?tradeId=" + ordSell.ord.tradeId + "\">X</a> </td>";

                  
              }
        }
        if (Object.prototype.hasOwnProperty.call(macd, 'openOrder') && macd.openOrder == 0 )
        {
          let lotDiff = Number(lots.sell) - Number(lots.buy) ; 
          let pipsDiff  = Number(ordSell.ord.grossPL)  / Number(ordSell.ord.amountK);
          if ( (lotDiff < rep.config.maxLot  
            && pipsDiff  < -2) ||(lotDiff < 0 && (pipsDiff > 2 || pipsDiff < -2)) 
              /*check if ord prof > than $1 per lot*/)
              {
                row = "<td>" + loadPairs[i].pair + "</td>"
                  + "<td>SELL(BIAS) Open SELL </td>"
                  + "<td><font color=\"green\">BUY(" + lots.buy + ")</font>--"
                  + " <font color=\"red\">SELL(" + lots.sell + ")</font></td>"
                  + "<td><font color=\"" + ((Number(ordBuy.pips) < 0)?"red":"green")  + "\">"
                  + parseFloat(ordBuy.pips).toFixed(5) + "</font>"
                  + "-- L("  +ordBuy.ord.amountK + ")&nbsp;&nbsp;&nbsp;&nbsp;"
                  + "<a href=\"" + rep.config.server_url + "/close?tradeId=" + ordBuy.ord.tradeId + "\">X</a><br>"
                  +  "OR <font color=\"" + ((Number(ordBuy.closestPips) < 0)?"red":"green")  + "\">"
                  + parseFloat(ordBuy.closestPips).toFixed(5) + "</font>"
                  + "-- L("  +ordBuy.closestOrder.amountK + ")&nbsp;&nbsp;&nbsp;&nbsp;"
                  + "<a href=\"" + rep.config.server_url + "/close?tradeId=" + ordBuy.closestOrder.tradeId + "\">X</a> </td>"
                  + "<td><font color=\"" + ((Number(ordSell.pips) < 0)?"red":"green")  + "\">"
                  + parseFloat(ordSell.pips).toFixed(5) + "</font>"
                  + "-- L("  +ordSell.ord.amountK + ")&nbsp;&nbsp;&nbsp;&nbsp;</td>";
                  
              }
        }// end if (Object.prototype.hasOwnProperty.call(macd, 'openOrder') && macd.openOrder == 1 )
      }// end if (macd.bias == 0)
      if (row.trim().length > 0)
      {
        rows.push("<tr>" + row + "</tr>");
      }
    }// end for (let i = 0;i < pairsToUpdate.length;i++)
    if (rows.length > 0)
    { // prepare email
      htmlEmailBody = "New Signals for pairs: <br>"
        + "<a href=\"" + rep.config.server_url + "/open_orders_291267s" + "\">Check Orders Online</a><br>" 
        + "<table><tr><th>Pairs</th><th>Bias</th><th>Lots</th><th>Last Buy Order</th><th>Last Sell Order</th></tr>";
        for (let i = 0;i < rows.length;i++)
        {
          htmlEmailBody += rows[i];
        }
        htmlEmailBody += "</table>";
        rep.mail('FXCM EA Alert',htmlEmailBody);
    }
  }
}

module.exports.macdSignalToEmail = async () =>
{
  let openPos = await this.createOrderTemplate(); 
  let rows = [];
  openPos.forEach((e) =>{
    //let row = [];
    let cells =[];
    if (e.macd && (e.macd.closeOrder || e.macd.openOrder))
    {
      if (Number(e.macd.bias) == 1)
      {
        if (e.macd.closeOrder && e.macd.closeOrder == 1 && Number (e.lotsBuy) > Number(e.lotsSell)
           && Number(e.lastBuy_grossPl) > (Number(e.lastBuy_lots)*1.5))
        {
          cells.push(e.pair);
          cells.push("BUY(BIAS) CLOSE BUY");
          cells.push("<font color=\"green\">BUY(" + e.lotsBuy + ")</font>--"
                     + "<font color=\"red\">SELL(" + e.lotsSell + ")</font>--");
          cells.push("<font color=\"" + ((Number(e.lastBuy_pips) < 0)?"red":"green")  + "\">"
                  + parseFloat(e.lastBuy_pips).toFixed(5) + "</font>"
          + "-- L("  + e.lastBuy_lots + ")&nbsp;&nbsp;&nbsp;&nbsp;"
          + "<a href=\"" + rep.config.server_url + "/close?tradeId=" + e.lastBuy_tradeId + "\">X</a> ");
          cells.push("<font color=\"" + ((Number(e.lastSell_pips) < 0)?"red":"green")  + "\">"
                  + parseFloat(e.lastSell_pips).toFixed(5) + "</font>"
                  + "-- L("  + e.lastSell_lots + ")&nbsp;&nbsp;&nbsp;&nbsp;");
        }
        if (e.macd.openOrder && e.macd.openOrder == 1 && Number(e.lotsBuy) - Number(e.lotsSell) < rep.config.maxLot)
        { 
          let pipsDiff  = Number(e.lastBuy_grossPl)  / Number(e.lastBuy_lots);
          if (pipsDiff < -2 || (pipsDiff > 1 && Number(e.lotsBuy) - Number(e.lotsSell) <= 0))
          {
            cells.push(e.pair);
            cells.push("BUY(BIAS) OPEN BUY");
            cells.push("<font color=\"green\">BUY(" + e.lotsBuy + ")</font>--"
                     + "<font color=\"red\">SELL(" + e.lotsSell + ")</font>--");
           cells.push("<font color=\"" + ((Number(e.lastBuy_pips) < 0)?"red":"green")  + "\">"
                  + parseFloat(e.lastBuy_pips).toFixed(5) + "</font>"
          + "-- L("  + e.lastBuy_lots + ")&nbsp;&nbsp;&nbsp;&nbsp;");
          cells.push("<font color=\"" + ((Number(e.lastSell_pips) < 0)?"red":"green")  + "\">"
                  + parseFloat(e.lastSell_pips).toFixed(5) + "</font>"
                  + "-- L("  + e.lastSell_lots + ")&nbsp;&nbsp;&nbsp;&nbsp;"
                  + "<a href=\"" + rep.config.server_url + "/close?tradeId=" + e.lastSell_trendId + "\">X</a> <br>"
                   + " OR"
                   + "<font color=\"" + ((Number(e.closeSell_pips) < 0)?"red":"green")  + "\">"
                  + parseFloat(e.closeSell_pips).toFixed(5) + "</font>"
                  + "-- L("  + e.closeSell_lots + ")&nbsp;&nbsp;&nbsp;&nbsp;"
                  + "<a href=\"" + rep.config.server_url + "/close?tradeId=" + e.closeSell_tradeId + "\">X</a> <br>"
                  );
          }

        }
      }// end if (Number(e.macd.bias) == 1)
 //------------------------------ SELL --------------------------------------------//
      if (Number(e.macd.bias) == 0)
      {
        if (typeof e.macd.closeOrder != undefined 
              && e.macd.closeOrder == 0 && Number (e.lotsSell) > Number(e.lotsBuy)
           && Number(e.lastSell_grossPl) > (Number(e.lastSell_lots)*1.5))
        {
          cells.push(e.pair);
          cells.push("BUY(SELL) CLOSE BUY");
          cells.push("<font color=\"green\">BUY(" + e.lotsBuy + ")</font>--"
                     + "<font color=\"red\">SELL(" + e.lotsSell + ")</font>--");
          cells.push("<font color=\"" + ((Number(e.lastBuy_pips) < 0)?"red":"green")  + "\">"
                  + parseFloat(e.lastBuy_pips).toFixed(5) + "</font>"
          + "-- L("  + e.lastBuy_lots + ")&nbsp;&nbsp;&nbsp;&nbsp;");
          cells.push("<font color=\"" + ((Number(e.lastSell_pips) < 0)?"red":"green")  + "\">"
                  + parseFloat(e.lastSell_pips).toFixed(5) + "</font>"
                  + "-- L("  + e.lastSell_lots + ")&nbsp;&nbsp;&nbsp;&nbsp;"
                  + "<a href=\"" + rep.config.server_url + "/close?tradeId=" + e.lastSell_trendId + "\">X</a> ");
        }
        if (typeof e.macd.openOrder != undefined 
                && e.macd.openOrder == 0 && Number(e.lotsSell) - Number(e.lotsBuy) < rep.config.maxLot)
        { 
          let pipsDiff  = Number(e.lastSell_grossPl)  / Number(e.lastSell_lots);
          if (pipsDiff < -2 || (pipsDiff > 1 && Number(e.lotsSell) - Number(e.lotsBuy) <= 0))
          {
            cells.push(e.pair);
            cells.push("BUY(SELL) OPEN SELL");
            cells.push("<font color=\"green\">BUY(" + e.lotsBuy + ")</font>--"
                     + "<font color=\"red\">SELL(" + e.lotsSell + ")</font>--");
           cells.push("<font color=\"" + ((Number(e.lastBuy_pips) < 0)?"red":"green")  + "\">"
                  + parseFloat(e.lastBuy_pips).toFixed(5) + "</font>"
                + "-- L("  + e.lastBuy_lots + ")&nbsp;&nbsp;&nbsp;&nbsp;"
                + "<a href=\"" + rep.config.server_url + "/close?tradeId=" + e.lastBuy_tradeId + "\">X</a> <br>"
                + "OR "
                + "<font color=\"" + ((Number(e.closeBuy_pips) < 0)?"red":"green")  + "\">"
                + parseFloat(e.closeBuy_pips).toFixed(5) + "</font>"
              + "-- L("  + e.closeBuy_lots + ")&nbsp;&nbsp;&nbsp;&nbsp;"
              + "<a href=\"" + rep.config.server_url + "/close?tradeId=" + e.closeBuy_tradeId + "\">X</a> <br>");
          cells.push("<font color=\"" + ((Number(e.lastSell_pips) < 0)?"red":"green")  + "\">"
                  + parseFloat(e.lastSell_pips).toFixed(5) + "</font>"
                  + "-- L("  + e.lastSell_lots + ")&nbsp;&nbsp;&nbsp;&nbsp;");
          }

        }
      }// end if (Number(e.macd.bias) == 0)

    }// end if (e.macd && (e.macd.closeOrder || e.macd.openOrder))
    if (cells.length > 0)
     rows.push(cells);
  });//end openPos.forEach((e) =>{
  if (rows.length)
  {
    let htmlEmailBody = "New Signals for pairs: <br>"
    + "<a href=\"" + rep.config.server_url + "/open_orders_291267s" + "\">Check Orders Online</a><br>" 
    + "<table><tr><th>Pairs</th><th>Bias</th><th>Lots</th><th>Last Buy Order</th><th>Last Sell Order</th></tr>";
    for (let i = 0;i < rows.length;i++)
    {
      let c = rows[i];
      htmlEmailBody += "<tr>";
      for (let k = 0;i < c.length;k++)
       htmlEmailBody += "<td>" + c[k] + "</td>";
      htmlEmailBody += "</tr>";
    }
    htmlEmailBody += "</table>";
    rep.mail('FXCM EA Alert',htmlEmailBody);
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
              ,"lastBuy_grossPl":ordBuy.ord.grossPL
              ,"lastSell_trendId":ordSell.ord.tradeId
              ,"lastSell_pips":ordSell.pips
              ,"lastSell_lots":ordSell.ord.amountK
              ,"lastSell_grossPl":ordSell.ord.grossPL
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
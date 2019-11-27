let rep = require('./repository');
let ea = require('./fxcm_macd_ea');
let band_ea = require('./fxcm_bands_ea');
let ords = require('./fxcm_orders');
let indic = require('./fxcm_indic');
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

module.exports.bandsSignalToEmail = async(openPos) =>{

  /***********************************************************************8
   * 
   * @returns array of {
   "lotsBuy":lots.buy,"lotsSell":lots.sell
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
              ,"closeBuy_grossPl":ordBuy.closestOrder.grossPL
              ,"closeSell_tradeId":ordSell.closestOrder.tradeId
              ,"closeSell_lots":ordSell.closestOrder.amountK
              ,"closeSell_pips":ordSell.closestPips
              ,"closeSell_grossPl":ordSell.closestOrder.grossPL
              ,"macd":s
            ,"band":band})
   */
  let rows = [];
  try{
    console.log(">>>>>>> bandsSignalToEmail createOrderTemplate [" + openPos.length + "]>>>>>>>");
    openPos.forEach((e) =>{
      let cells =[];
      
      if (e.macd.closestOrder == 0 /*&& e.band.type == 0*/ && e.band.signal == 1 )
      {
        cells.push(e.pair);
        cells.push("MACD(" +(Number(e.macd.bias) == 1 ? "BUY" : 
                          Number(e.macd.bias == 0?"SELL":"NA") )  + ")"
                            + "BAND(" + (Number(e.band.type == 1) ? "BUY":
                              Number(e.band.type == 0)?"SELL":"NA") + 
                              ") CLOSE SELL");
      }
      if (e.macd.closestOrder == 1 /*&& e.band.type == 0*/ && e.band.signal == 0 )
      {
        cells.push(e.pair);
        cells.push("MACD(" +(Number(e.macd.bias) == 1 ? "BUY" : 
                          Number(e.macd.bias == 0?"SELL":"NA") )  + ")"
                            + "BAND(" + (Number(e.band.type == 1) ? "BUY":
                              Number(e.band.type == 0)?"SELL":"NA") + 
                              ") CLOSE BUY");
      }
      if (e.macd.closestOrder != 1  && e.band.type == 1 && e.band.signal == 1 )
      {
        cells.push(e.pair);
        cells.push("MACD(" +(Number(e.macd.bias) == 1 ? "BUY" : 
                          Number(e.macd.bias == 0?"SELL":"NA") )  + ")"
                            + "BAND(" + (Number(e.band.type == 1) ? "BUY":
                              Number(e.band.type == 0)?"SELL":"NA") + 
                              ") OPEN BUY");
      }
      

      if (e.macd.closestOrder != 0  && e.band.type == 0 && e.band.signal == 0 )
      {
        cells.push(e.pair);
        cells.push("MACD(" +(Number(e.macd.bias) == 1 ? "BUY" : 
                          Number(e.macd.bias == 0?"SELL":"NA") )  + ")"
                            + "BAND(" + (Number(e.band.type == 1) ? "BUY":
                              Number(e.band.type == 0)?"SELL":"NA") + 
                              ") OPEN SELL");
      }

      if (cells.length > 0)
      { // add the rest if there is a signal
          cells.push("<font color=\"green\">BUY(" + e.lotsBuy + ")</font>--"
          + "<font color=\"red\">SELL(" + e.lotsSell + ")</font>--"); 
          cells.push("<font color=\"" + ((Number(e.lastBuy_pips) < 0)?"red":"green")  + "\">("
                  + parseFloat(e.lastBuy_pips).toFixed(5) + ")$("
                  + parseFloat(e.lastBuy_grossPl).toFixed(2) + ")</font>"
          + "-- L("  + e.lastBuy_lots + ")&nbsp;&nbsp;&nbsp;&nbsp;"
          + "<a href=\"" + rep.config.server_url + "/close?tradeId=" + e.lastBuy_tradeId + "\">X</a> ");
          cells.push("<font color=\"" + ((Number(e.closeBuy_pips) < 0)?"red":"green")  + "\">("
          + parseFloat(e.closeBuy_pips).toFixed(5) + ")$("
          + parseFloat(e.closeBuy_grossPl).toFixed(2) + ")</font>"
          + "-- L("  + e.closeBuy_lots + ")&nbsp;&nbsp;&nbsp;&nbsp;"
          + "<a href=\"" + rep.config.server_url + "/close?tradeId=" + e.closeBuy_tradeId + "\">X</a> ");

          cells.push("<font color=\"" + ((Number(e.lastSell_pips) < 0)?"red":"green")  + "\">("
          + parseFloat(e.lastSll_pips).toFixed(5) + ")$("
          + parseFloat(e.lastSll_grossPl).toFixed(2) + ")</font>"
          + "-- L("  + e.lastSell_lots + ")&nbsp;&nbsp;&nbsp;&nbsp;"
          + "<a href=\"" + rep.config.server_url + "/close?tradeId=" + e.lastSell_tradeId + "\">X</a> ");
          cells.push("<font color=\"" + ((Number(e.closeSell_pips) < 0)?"red":"green")  + "\">("
          + parseFloat(e.closeSell_pips).toFixed(5) + ")$("
          + parseFloat(e.closeSell_grossPl).toFixed(2) + ")</font>"
          + "-- L("  + e.closeSell_lots + ")&nbsp;&nbsp;&nbsp;&nbsp;"
          + "<a href=\"" + rep.config.server_url + "/close?tradeId=" + e.closeSell_tradeId + "\">X</a> ");
          rows.push(cells);
      }//end if  if (cells.length > 0)
    });

    if (rows.length)
  {
    let htmlEmailBody = "New BAND Signals for pairs: <br>"
    + "<a href=\"" + rep.config.server_url + "/open_orders_291267" + "\">Check Orders Online</a><br>" 
    + "<table><tr><th>Pairs</th><th>Bias</th><th>Lots</th><th>Last Buy Order</th>"
    + "<th>Closest BUY</th><th>Last Sell Order</th><th>Closest SELL</th></tr>";
    for (let i = 0;i < rows.length;i++)
    {
      let c = rows[i];
      htmlEmailBody += "<tr>";
      for (let k = 0;i < c.length;k++)
       htmlEmailBody += "<td>" + c[k] + "</td>";
      htmlEmailBody += "</tr>";
    }
    htmlEmailBody += "</table>";
    console.log(">>>>>> #### SENDIGN EMAIL ALERT ######$$$>>>>>");
    rep.mail('FXCM EA BAND Alert',htmlEmailBody);
  }
  }catch (e)
  {
    console.log(e);
  }
}
module.exports.macdSignalToEmail = async (openPos) =>
{
  //let openPos = await this.createOrderTemplate(); 
  let rows = [];
  try{
  console.log(">>>>>>> macdSignalToEmail() createOrderTemplate [" + openPos.length + "]>>>>>>>");
  let d = new Date();
  openPos.forEach(async (e) =>{
    //let row = [];
    let cells =[];
    //let pair  =  e.pair.replace(/([^a-z0-9]+)/gi, '');
    //let macdLastHour = rep.store.get("macd_" + pair);
    /*
    if ((!macdLastHour || macdLastHour != d.getHours()) && d.getMinutes() > 50 )
    {
      let hourMacd = await require('./alphavantage_ea').macd(pair,"60min",500);
      rep.store.set("macd_" + pair,d.getHours());
      if (hourMacd.signal)
      {
        if (hourMacd.signal == 1)
        {
          cells.push(e.pair);
          cells.push("1 HOUR(FRAME) CLOSE BUY");
          cells.push("<font color=\"green\">BUY(" + e.lotsBuy + ")</font>--"
          + "<font color=\"red\">SELL(" + e.lotsSell + ")</font>--");
          cells.push("<font color=\"" + ((Number(e.lastBuy_pips) < 0)?"red":"green")  + "\">"
                  + parseFloat(e.lastBuy_pips).toFixed(5) + "</font>"
          + "-- L("  + e.lastBuy_lots + ")&nbsp;&nbsp;&nbsp;&nbsp;"
          + "<a href=\"" + rep.config.server_url + "/close?tradeId=" + e.lastBuy_tradeId + "\">X</a> "
          + " OR "
          + "<font color=\"" + ((Number(e.closeBuy_pips) < 0)?"red":"green")  + "\">"
          + parseFloat(e.closeBuy_pips).toFixed(5) + "</font>"
            + "-- L("  + e.closeBuy_lots + ")&nbsp;&nbsp;&nbsp;&nbsp;"
          + "<a href=\"" + rep.config.server_url + "/close?tradeId=" + e.closeBuy_tradeId + "\">X</a> ");
          cells.push("<font color=\"" + ((Number(e.lastSell_pips) < 0)?"red":"green")  + "\">"
                  + parseFloat(e.lastSell_pips).toFixed(5) + "</font>"
                  + "-- L("  + e.lastSell_lots + ")&nbsp;&nbsp;&nbsp;&nbsp;");
        }
        if (hourMacd.signal == 3)
        {
          cells.push(e.pair);
          cells.push("1 HOUR(FRAME) CLOSE SELL");
          cells.push("<font color=\"green\">BUY(" + e.lotsBuy + ")</font>--"
                     + "<font color=\"red\">SELL(" + e.lotsSell + ")</font>--");
          cells.push("<font color=\"" + ((Number(e.lastBuy_pips) < 0)?"red":"green")  + "\">"
                  + parseFloat(e.lastBuy_pips).toFixed(5) + "</font>"
          + "-- L("  + e.lastBuy_lots + ")&nbsp;&nbsp;&nbsp;&nbsp;");
          cells.push("<font color=\"" + ((Number(e.lastSell_pips) < 0)?"red":"green")  + "\">"
                  + parseFloat(e.lastSell_pips).toFixed(5) + "</font>"
                  + "-- L("  + e.lastSell_lots + ")&nbsp;&nbsp;&nbsp;&nbsp;"
                  + "<a href=\"" + rep.config.server_url + "/close?tradeId=" + e.lastSell_trendId + "\">X</a> "
                  + " OR "
                  + "<font color=\"" + ((Number(e.closeSell_pips) < 0)?"red":"green")  + "\">"
                  + parseFloat(e.closeSell_pips).toFixed(5) + "</font>"
                  + "-- L("  + e.closeSell_lots + ")&nbsp;&nbsp;&nbsp;&nbsp;"
                  + "<a href=\"" + rep.config.server_url + "/close?tradeId=" + e.closeSell_tradeId + "\">X</a> ");
        }
        
      }
    }
    */
    console.log(" >>>>>>>>>>>>> PARSE ELEMENT [" + e.pair + "]",e.macd);
    if (e.macd)
    {
      if (typeof e.macd.closestOrder !== 'undefined')
      {
                
        if (Number( e.macd.closeOrder) == 1)
        {
          console.log(">>>>>>> CLOSE BUY  >>>>>>");
          cells.push(e.pair);
          cells.push("BIAS(" + (e.macd.bias == 1?"<font color=\"green\">BUY"
                        : "<font color=\"red\">SELL") + "</font>) CLOSE BUY");
        }
        if (Number(e.macd.closeOrder) == 0)
        {
          console.log(">>>>>>> CLOSE SELL  >>>>>>");
          cells.push(e.pair);
          cells.push("BIAS(" + (e.macd.bias == 1?"<font color=\"green\">BUY"
                        : "<font color=\"red\">SELL") + "</font>) CLOSE SELL");
        }
      }
      else if (typeof e.macd.openOrder !== 'undefined')
      {
        if (Number(e.macd.openOrder) == 1)
        {
          console.log(">>>>>>> OPEN BUY  >>>>>>");
          cells.push(e.pair);
          cells.push("BIAS(" + (e.macd.bias == 1?"<font color=\"green\">BUY"
                        : "<font color=\"red\">SELL") + "</font>) OPEN BUY");
        }
        if (Number(e.macd.openOrder) == 0)
        {
          console.log(">>>>>>> OPEN SELL  >>>>>>");
          cells.push(e.pair);
          cells.push("BIAS(" + (e.macd.bias == 1?"<font color=\"green\">BUY"
                        : "<font color=\"red\">SELL") + "</font>) OPEN SELL");
        }
      }
      if (cells.length > 0)
      { // add the rest if there is a signal
          cells.push("<font color=\"green\">BUY(" + e.lotsBuy + ")</font>--"
          + "<font color=\"red\">SELL(" + e.lotsSell + ")</font>--"); 
          cells.push("<font color=\"" + ((Number(e.lastBuy_pips) < 0)?"red":"green")  + "\">("
                  + parseFloat(e.lastBuy_pips).toFixed(5) + ")$("
                  + parseFloat(e.lastBuy_grossPl).toFixed(2) + ")</font>"
          + "-- L("  + e.lastBuy_lots + ")&nbsp;&nbsp;&nbsp;&nbsp;"
          + "<a href=\"" + rep.config.server_url + "/close?tradeId=" + e.lastBuy_tradeId + "\">X</a> ");
          cells.push("<font color=\"" + ((Number(e.closeBuy_pips) < 0)?"red":"green")  + "\">("
          + parseFloat(e.closeBuy_pips).toFixed(5) + ")$("
          + parseFloat(e.closeBuy_grossPl).toFixed(2) + ")</font>"
          + "-- L("  + e.closeBuy_lots + ")&nbsp;&nbsp;&nbsp;&nbsp;"
          + "<a href=\"" + rep.config.server_url + "/close?tradeId=" + e.closeBuy_tradeId + "\">X</a> ");

          cells.push("<font color=\"" + ((Number(e.lastSell_pips) < 0)?"red":"green")  + "\">("
          + parseFloat(e.lastSll_pips).toFixed(5) + ")$("
          + parseFloat(e.lastSll_grossPl).toFixed(2) + ")</font>"
          + "-- L("  + e.lastSell_lots + ")&nbsp;&nbsp;&nbsp;&nbsp;"
          + "<a href=\"" + rep.config.server_url + "/close?tradeId=" + e.lastSell_tradeId + "\">X</a> ");
          cells.push("<font color=\"" + ((Number(e.closeSell_pips) < 0)?"red":"green")  + "\">("
          + parseFloat(e.closeSell_pips).toFixed(5) + ")$("
          + parseFloat(e.closeSell_grossPl).toFixed(2) + ")</font>"
          + "-- L("  + e.closeSell_lots + ")&nbsp;&nbsp;&nbsp;&nbsp;"
          + "<a href=\"" + rep.config.server_url + "/close?tradeId=" + e.closeSell_tradeId + "\">X</a> ");
          cells.push("<a href=\"/open?pair=" + e.pair + "&type=1\" >BUY</a> <br>"
                  +"<a href=\"/open?pair=" + e.pair + "&type=0\" >SELL</a>")
          cells.push("<a href=\"/openFuture?pair=" + e.pair + "&type=1\" >Future BUY</a> <br>"
                    + "<a hrefs=\"/openFuture?pair=" + e.pair  +"&type=0\" >Future SELL</a>");
          rows.push(cells);
      }//end if  if (cells.length > 0)
    }
    
  });//end openPos.forEach((e) =>{
  if (rows.length > 0)
  {
    let htmlEmailBody = "New MACD Signals for pairs: <br>"
    + "<a href=\"" + rep.config.server_url + "/open_orders_291267s" + "\">Check Orders Online</a><br>" 
    + "<table><tr><th>Pairs</th><th>Bias</th><th>Lots</th><th>Last Buy Order</th><th>Last Sell Order</th>"
     + "<th>Open Order</th><th>Open Future</th></tr>";
    for (let i = 0;i < rows.length;i++)
    {
      let c = rows[i];
      htmlEmailBody += "<tr>";
      for (let k = 0;i < c.length;k++)
       htmlEmailBody += "<td>" + c[k] + "</td>";
      htmlEmailBody += "</tr>";
    }
    htmlEmailBody += "</table>";
    console.log(">>>>>> #### SENDIGN EMAIL ALERT ######$$$>>>>>");
    rep.mail('FXCM EA MACD Alert',htmlEmailBody);
  }
  }catch(e)
  {
    console.log(e.stack);
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
 *    ,"ma50":ma50[],"ma100":ma100[],"ma200":ma200[],"bands": {"upper":ExtUpperBuffer,"lower":ExtLowerBuffer,"ma":ExtMABuffer} 
 * }
 */
module.exports.createOrderTemplate = async () =>{
  let templateArrays = [];
  try{
    let trading = rep.store.get(rep.storeKey.trading);
    loadPairs = JSON.parse(trading);
    //console.log(loadPairs);
    
    for (let i = 0;i < loadPairs.length;i++)
    {
      let candles = rep.store.get(loadPairs[i].pair);
      candles = JSON.parse(candles);
      candles = candles.sort((a, b) => {
        return (b[0] - a[0]); // sort decending by time where newest time is first
      });
      let s;
      //s =  await ea.macd_siganal(candles,500);
      //let band = await band_ea.band_siganal(candles);//     await indic.bands(candles,ma12,12);
      let lots = await ords.orderLots(loadPairs[i].pair);
      let ordBuy = await ords.lastOpenOrder(loadPairs[i].pair,true);
      let ordSell = await ords.lastOpenOrder(loadPairs[i].pair,false);
      templateArrays.push({"pair":loadPairs[i].pair
          , "bias":(s && typeof s.bias !== 'undefined' && s.bias !== null )? ( s.bias == 1?"BUY":s.bias == 0?"SELL":"NA"):"ERROR(NA)"
          , "lotsBuy":lots.buy,"lotsSell":lots.sell
              ,"lastBuy_tradeId":ordBuy.ord.tradeId
              ,"lastBuy_pips":ordBuy.pips
              ,"lastBuy_lots":ordBuy.ord.amountK
              ,"lastBuy_grossPl":Number(ordBuy.pips) * Number(loadPairs[i].digits)//ordBuy.ord.grossPL
              ,"lastSell_trendId":ordSell.ord.tradeId
              ,"lastSell_pips":ordSell.pips
              ,"lastSell_lots":ordSell.ord.amountK
              ,"lastSell_grossPl":Number(ordSell.pips) * Number(loadPairs[i].digits) //ordSell.ord.grossPL
              ,"closeBuy_tradeId":ordBuy.closestOrder.tradeId
              ,"closeBuy_lots":ordBuy.closestOrder.amountK
              ,"closeBuy_pips":ordBuy.closestPips
              ,"closeBuy_grossPl":Number(ordBuy.closestPips) * Number(loadPairs[i].digits)//ordBuy.closestOrder.grossPL
              ,"closeSell_tradeId":ordSell.closestOrder.tradeId
              ,"closeSell_lots":ordSell.closestOrder.amountK
              ,"closeSell_pips":ordSell.closestPips
              ,"closeSell_grossPl":Number(ordSell.closestPips) * Number(loadPairs[i].digits)//ordSell.closestOrder.grossPL
              ,"macd":s
            /*,"band":band*/})
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
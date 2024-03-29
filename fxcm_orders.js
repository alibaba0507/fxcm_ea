let rep = require('./repository');
let store = require('./repository').store;

let utils = require('./utils');

let conn = require('./fxcm_connect');

module.exports.orderByTradeId = async (tradeId) =>
{
    try{
        let acc_open_ords = store.get(rep.storeKey.open_possitions);
        if (!acc_open_ords) return;
        acc_open_ords = JSON.parse(acc_open_ords);
        let pos = acc_open_ords.find((e)=>{return (e.tradeId === tradeId);});
        return pos;
    }catch (e)
    {
        console.log(e.stack);
    }
}
module.exports.orderLots = async (pair)=>{
    let acc_open_ords = store.get(rep.storeKey.open_possitions);
    if (!acc_open_ords) {return {"pair":pair,"error":"No lots present for[" + pair + "]"};}
    acc_open_ords = JSON.parse(acc_open_ords);
    let buyLots = 0;
    let sellLots = 0;
    for (let i =0;i < acc_open_ords.length;i++)
    {
        if (acc_open_ords[i].currency == pair)
        {
          if (acc_open_ords[i].isBuy)
           buyLots += acc_open_ords[i].amountK;
          else
           sellLots += acc_open_ords[i].amountK;
        }
    }
    return {"pair":pair,"buy":buyLots,"sell":sellLots};
}

module.exports.lastOpenOrder = async (pair,isBuy = false) =>
{
    try{
        let acc_open_ords = store.get(rep.storeKey.open_possitions);
        if (!acc_open_ords) {return {"pair":pair,"error":"No lastOrders for[" + pair + "]"};}
        acc_open_ords = JSON.parse(acc_open_ords);
        let ords_to_close = await utils.sortAccOrders(acc_open_ords
            , pair, (isBuy === true) ? 1 : 0, null,true);
       // console.log(">>>>>> ["  +pair + "] openORDS[" + acc_open_ords.length + "] after Sort [" + ords_to_close.length + "]>>>");
        let candles = store.get(pair);
        candles = JSON.parse(candles);
        if (ords_to_close.length > 0) {
            let c = Number(candles[0][rep.candleParams.BidClose]);
            let diff = Number(ords_to_close[0].open);
            diff = (isBuy == true) ? c - diff : diff - c;
            let lastOrder = ords_to_close[0];
            // Sort closest to current price
            ords_to_close.sort((a,b)=>{
                return Math.abs(c-Number(a.open)) - Math.abs(c-Number(b.open));
              });
            let closestToCurrentPrice = ords_to_close[0];
            let clsPrDif =  (isBuy == true) ? c - Number(ords_to_close[0].open) : Number(ords_to_close[0].open) - c;
            return {"pair":pair,"ord":lastOrder, "pips":diff,"closestOrder":closestToCurrentPrice,"closestPips":clsPrDif};
        }
  }catch (e)
  {
      console.log(e.stack);
  }
}
module.exports.OpenPositionListener = async (update) =>{
  try{
    var jsonData = JSON.parse(update);
    if (!jsonData.tradeId || jsonData.isTotal == true){return;}
   // console.log('  UPDATE OPEN POSSITIONS ',jsonData);
    
    let store_open_pos = store.get(rep.storeKey.open_possitions);
    if (store_open_pos && Array.isArray(JSON.parse(store_open_pos)))
    {
        store_open_pos = JSON.parse(store_open_pos);
        let pos = store_open_pos.find((e)=>{return (jsonData.tradeId && e.tradeId === jsonData.tradeId);});
			
       
        if (pos)
        {
           // console.log("///%%%%%%%%%%%%%%   #$$##$$$ ",pos);
            if (pos.grossPL != jsonData.grossPL)
            {
            //	console.log('>>>>>>>> OPEN POS has Canged[' + pos.currency + '] [' 
            //				+ jsonData.tradeId 
            //		+ ']NEW [' + jsonData.grossPL + '] OLD [' + pos.grossPL +'] >>>>>>' );
                //	hasChange = true;
                    pos.grossPL = jsonData.grossPL;
                    pos.close = jsonData.close;
                    pos.visiblePL = jsonData.visiblePL;
                store.set(rep.storeKey.open_possitions,JSON.stringify(store_open_pos));
            }// end if (pos.grossPL != jsonData.grossPL)
        }//end if (pos)
        else
        {
            store.set("updateOpenPosition",1);
           // let cmd = '{ "method":"GET", "resource":"/trading/get_model", "params": { "models":["Offer","OpenPosition","ClosedPosition","Order","Account", "Summary"] } }'
          /*  let cmd = '{ "method":"GET", "resource":"/trading/get_model", "params": { "models":["OpenPosition"] } }'
            let open_pos = await conn.authenticate(cmd);
            if (open_pos.data )
            {
                var jsonData = JSON.parse(open_pos.data);
                store.store.set(store.storeKey.open_possitions,JSON.stringify (jsonData.open_positions)); 
            }
            */
            /*
            await this.subscibeOpenPosition(true);
            await utils.sleep(500);
            await this.updateOpenPositions();
            await utils.sleep(500);
            this.subscibeOpenPosition();
            */

        }
    }else
    {
        /*
        let cmd = '{ "method":"GET", "resource":"/trading/get_model", "params": { "models":["OpenPosition"] } }'
        let open_pos = await conn.authenticate(cmd);
        if (open_pos.data )
        {
            var jsonData = JSON.parse(open_pos.data);
            store.store.set(store.storeKey.open_possitions,JSON.stringify (jsonData.open_positions)); 
        }
        */
       /* await this.subscibeOpenPosition(true);
        await utils.sleep(500);
        await this.updateOpenPositions();
        await utils.sleep(500);
        this.subscibeOpenPosition();
        */
       store.set("updateOpenPosition",1);
    }
    
  }catch (e)
  {
   console.log("Error OpenPosition[" + e.stack + "]");
  }
}



module.exports.ClosedPositionListener = async (update) =>{
    try{
      var jsonData = JSON.parse(update);
      if (!jsonData.tradeId || jsonData.isTotal == true){return;}
      //console.log('  UPDATE OPEN POSSITIONS ',jsonData);
      let store_open_pos = store.get(rep.storeKey.open_possitions);
      if (store_open_pos && Array.isArray(JSON.parse(store_open_pos)))
      {
          store_open_pos = JSON.parse(store_open_pos);
          //let pos = store_open_pos.find((e)=>{return (jsonData.tradeId && e.tradeId === jsonData.tradeId);});
          //if (pos)
         // { // we hava order on open need to be removed
            
            let k = 0;
            for (k = 0;k < store_open_pos.length;k++)
            {
                if (store_open_pos[k].tradeId == jsonData.tradeId)
                 break;
            }
            if (k < store_open_pos.length)
            {
               // remove order 
               store_open_pos.splice(k,1);
               // save the result
               store.set(rep.storeKey.open_possitions,JSON.stringify(store_open_pos));
            }
          //}
      }
    }catch (e)
    {
      throw new Error("Error ClosedPosition[" + e + "]");
    }
  }


module.exports.subscibeOpenPosition = async (unsubscribe = false) =>{
	var callback = (statusCode, requestID, data,err,indx,socket) => {
        try{
            if (statusCode === 200) {
                let jsonData = JSON.parse(data);
                if(jsonData.response.executed) {
                    let id = store.get('subscibeOpenPosition');
                    /*console.log(' >>>>> SUBSCRIBE reqId[' + requestID 
                            + '] satatus [' + statusCode + '] data [' 
                            + data + '] ID [' + id + '] >>>>>>>>>>>>>>>>>>')
                    */
                    if (id != requestID)
                        store.set("subscibeOpenPosition",requestID);
                    
                    socket.on('OpenPosition',(update)=>{
                        //['Offer', 'Account', 'Order', 'OpenPosition', 'ClosedPosition', 'Summary', 'Properties'];
                        this.OpenPositionListener(update);
                        
                    });
                }
            }else{
                store.set("subscibeOpenPosition","0");
                //throw new Error("Error status[" + statusCode + "][" + err  +"]"); //inside callback 
            }
        }catch (e)
        {
            store.set("subscibeOpenPosition","0");
	        console.log('subscibeOpenPosition() subscribe request #', requestID, ' JSON parse error: ', e);
        }
    };    
    let action = store.get('subscibeOpenPosition');
    if (typeof action === 'undefined' || action == null)
    {
        conn.authenticate('{ "method":"POST", "resource":"/trading/subscribe", "params": { "models":"OpenPosition" } }', callback );
        await utils.sleep(2000);
    }else if (action == "0" || unsubscribe)
    {
        await conn.authenticate('{ "method":"POST", "resource":"/trading/unsubscribe", "params": { "models":"OpenPosition" } }' );
        store.delete('subscibeOpenPosition');
        await utils.sleep(15000);
        if (!unsubscribe)
            this.subscibeOpenPosition();
    }
}



module.exports.subscibeClosedPosition = async () =>{
	var callback = (statusCode, requestID, data,err,indx,socket) => {
        try{
            if (statusCode === 200) {
                let jsonData = JSON.parse(data);
                if(jsonData.response.executed) {
                    let id = store.get('subscibeClosedPosition');
                    /*console.log(' >>>>> SUBSCRIBE reqId[' + requestID 
                            + '] satatus [' + statusCode + '] data [' 
                            + data + '] ID [' + id + '] >>>>>>>>>>>>>>>>>>')
                    */
                    if (id != requestID)
                        store.set("subscibeClosedPosition",requestID);
                    
                    socket.on('ClosedPosition',(update)=>{
                        //['Offer', 'Account', 'Order', 'OpenPosition', 'ClosedPosition', 'Summary', 'Properties'];
                        this.ClosedPositionListener(update);
                        
                    });
                }
            }else{
                store.set("subscibeClosedPosition","0");
               // throw new Error("Error status[" + statusCode + "][" + err  +"]"); //inside callback 
            }
        }catch (e)
        {
            store.set("subscibeClosedPosition","0");
	        console.log('subscibeClosedPosition() subscribe request #', requestID, ' JSON parse error: ', e);
        }
    };    
    let action = store.get('subscibeClosedPosition');
    if (typeof action === 'undefined'  || action == null)
    {
        conn.authenticate('{ "method":"POST", "resource":"/trading/subscribe", "params": { "models":"ClosedPosition" } }', callback );
        await utils.sleep(2000);
    }else if (action == "0")
    {
        await conn.authenticate('{ "method":"POST", "resource":"/trading/unsubscribe", "params": { "models":"ClosedPosition" } }' );
        store.delete('subscibeClosedPosition');
        await utils.sleep(2000);
        this.subscibeClosedPosition();
    }
}


module.exports.updateOpenPositions = async () =>{
    let needUpdate = store.get("updateOpenPosition");
    if (!needUpdate)
     return;
    let cmd = '{ "method":"GET", "resource":"/trading/get_model", "params": { "models":["OpenPosition"] } }'
    let open_pos = await conn.authenticate(cmd);
    if (open_pos.data )
    {
        var jsonData = JSON.parse(open_pos.data);
        store.set(rep.storeKey.open_possitions,JSON.stringify (jsonData.open_positions)); 
        store.delete("updateOpenPosition");
    }
    //console.log(" >>>>>>>> POSITOPNS ",open_pos.data);
    await utils.sleep(500);
}
module.exports.closeOrder = async (order) =>{
    if (!order || !order.amountK || !order.tradeId){return;}
    if ( Number(order.amountK) < 1){order.amountK *= 100;}
    let cmd = '{ "method":"POST", "resource":"/trading/close_trade",'
    + '"params": { "amount":' + order.amountK 
    + ', "time_in_force":"GTC",'
    +  '"trade_id":"' + Number(order.tradeId)
     + '" } }';
     let ord_data = await conn.authenticate(cmd);
     // if succesfull this will trigger ClosedPositionListener () 
     // and will update Orders cashed table ...
     if (ord_data.data)
     {
         console.log(">>>>>>> AFTER CLOSING ORDER [" + order.tradeId + "]");
         console.log(ord_data);
         let acc_open_ords = store.get(rep.storeKey.open_possitions);
        // if (!acc_open_ords) {return {"pair":pair,"error":"No lastOrders for[" + pair + "]"};}
         acc_open_ords = JSON.parse(acc_open_ords);
         let k = 0;
         for (k = 0;k < acc_open_ords.length;k++)
         {
             if (acc_open_ords[k].tradeId == order.tradeId)
              break;
         }
         if (k < acc_open_ords.length)
         {
            // remove order 
            acc_open_ords.splice(k,1);
            // save the result
             store.set(rep.storeKey.open_possitions,JSON.stringify(acc_open_ords));
         }
     }
     return ord_data;
} 


module.exports.openOrder = async (pair,isBuy,lots) =>{
    if (Number(lots) <= 0)
    {
        console.log(">>>>>> openOrder[" +pair + "," + isBuy + "," + lots + "] Lots must be grater then zerro");
        return;
    }
    let cmd = '{ "method":"POST", "resource":"/trading/open_trade",'
            +' "params": { "account_id":"' + rep.config.fxcm_acc   + '"' +
              ', "symbol":"' + pair + '"' +
               ', "is_buy":' + isBuy + 
               ', "amount":' + lots + 
               ', "time_in_force":"FOK" } }';
    
     let ord_data = await conn.authenticate(cmd);
     if (ord_data.data)
     {
         console.log(">>>>>>> AFTER OPEN ORDER [" + (ord_data.statusCode == 200 ? "SUCCESS":"FAIL") + "]");
         console.log(ord_data.data);
     }
     return ord_data.data;
}

module.exports.openPendingPossition = async (pair,priceAt,isBuy,lots) =>{
    let cmd = ' { "method":"POST", "resource":"/trading/create_entry_order",'
    +' "params": { "account_id":"' + rep.config.fxcm_acc + '"'  
     + ', "symbol":"' + pair + '"'
     + ', "is_buy":' + isBuy 
     + ', "rate":' + Number(priceAt) 
     + ', "amount":' + Number(lots) + ' } }';
     let ord_data = await conn.authenticate(cmd);
     if (ord_data.data)
     {
         console.log(">>>>>>> AFTER OPEN PENDING POSITION [" + (ord_data.statusCode == 200 ? "SUCCESS":"FAIL") + "]");
         console.log(ord_data.data);
     }
     return ord_data.data;
}

/**
 * @param orderId - this is  id of pending order , DO NOT mix it with
 *   tradeId which is id of open Order 
 * */ 
module.exports.deletePendingPossition = async (orderId) =>{
    let cmd = '{ "method":"POST", "resource":"/trading/delete_order"'
                +', "params": { "order_id":"' + ordersToclose[i].orderId + '" } }';
     let ord_data = await conn.authenticate(cmd);
     if (ord_data.data)
     {
         console.log(">>>>>>> AFTER DELETE PENDING POSITION [" + (ord_data.statusCode ? "SUCCESS":"FAIL") + "]");
         console.log(ord_data.data);
     }
     return ord_data;
}


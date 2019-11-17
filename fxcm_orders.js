let rep = require('./repository');
let store = require('./repository').store;

let utils = require('./utils');

let conn = require('./fxcm_connect');

module.exports.OpenPosition = async (update) =>{
  try{
    var jsonData = JSON.parse(update);
    if (!jsonData.tradeId || jsonData.isTotal == true){return;}
    //console.log('  UPDATE OPEN POSSITIONS ',jsonData);
    let store_open_pos = store.get(rep.storeKey.open_possitions);
    if (Array.isArray(JSON.parse(store_open_pos)))
    {
        store_open_pos = JSON.parse(store_open_pos);
        let pos = store_open_pos.find((e)=>{return (jsonData.tradeId && e.tradeId === jsonData.tradeId);});
			
       
        if (pos)
        {
            if (pos.grossPL != jsonData.grossPL)
            {
            //	console.log('>>>>>>>> OPEN POS has Canged[' + pos.currency + '] [' 
            //				+ jsonData.tradeId 
            //		+ ']NEW [' + jsonData.grossPL + '] OLD [' + pos.grossPL +'] >>>>>>' );
                //	hasChange = true;
                    pos.grossPL = jsonData.grossPL;
                    pos.close = jsonData.close;
                pos.visiblePL = jsonData.visiblePL;
                store.store.set(store.storeKey.open_possitions,JSON.stringify(store_open_pos));
            }// end if (pos.grossPL != jsonData.grossPL)
        }//end if (pos)
        else
        {
           // let cmd = '{ "method":"GET", "resource":"/trading/get_model", "params": { "models":["Offer","OpenPosition","ClosedPosition","Order","Account", "Summary"] } }'
            let cmd = '{ "method":"GET", "resource":"/trading/get_model", "params": { "models":["OpenPosition"] } }'
            let open_pos = await conn.authenticate(cmd);
            if (open_pos.data )
            {
                var jsonData = JSON.parse(open_pos.data);
                store.store.set(store.storeKey.open_possitions,JSON.stringify (jsonData.open_positions)); 
            }
        }
    }
  }catch (e)
  {
    throw new Error("Error OpenPosition[" + e + "]");
  }
}



module.exports.ClosedPosition = async (update) =>{
    try{
      var jsonData = JSON.parse(update);
      if (!jsonData.tradeId || jsonData.isTotal == true){return;}
      //console.log('  UPDATE OPEN POSSITIONS ',jsonData);
      let store_open_pos = store.get(rep.storeKey.open_possitions);
      if (Array.isArray(JSON.parse(store_open_pos)))
      {
          store_open_pos = JSON.parse(store_open_pos);
          let pos = store_open_pos.find((e)=>{return (jsonData.tradeId && e.tradeId === jsonData.tradeId);});
          if (pos)
          { // we hava order on open need to be removed
             // let cmd = '{ "method":"GET", "resource":"/trading/get_model", "params": { "models":["Offer","OpenPosition","ClosedPosition","Order","Account", "Summary"] } }'
              let cmd = '{ "method":"GET", "resource":"/trading/get_model", "params": { "models":["OpenPosition"] } }'
              let open_pos = await conn.authenticate(cmd);
              if (open_pos.data )
              {
                  var jsonData = JSON.parse(open_pos.data);
                  store.store.set(store.storeKey.open_possitions,JSON.stringify (jsonData.open_positions)); 
              }
          }
      }
    }catch (e)
    {
      throw new Error("Error ClosedPosition[" + e + "]");
    }
  }


module.exports.subscibeOpenPosition = async () =>{
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
                        this.OpenPosition(update);
                        
                    });
                }
            }else
                throw new Error("Error status[" + statusCode + "][" + err  +"]"); //inside callback 
        }catch (e)
        {
            store.set("subscibeOpenPosition","0");
	        console.log('subscibeOpenPosition() subscribe request #', requestID, ' JSON parse error: ', e);
        }
    };    
    let action = store.get('subscibeOpenPosition');
    if (typeof action === 'undefined')
    {
        conn.authenticate('{ "method":"POST", "resource":"/trading/subscribe", "params": { "models":"OpenPosition" } }', callback );
        await utils.sleep(2000);
    }else if (action == "0")
    {
        await conn.authenticate('{ "method":"POST", "resource":"/trading/unsubscribe", "params": { "models":"OpenPosition" } }' );
        store.delete('subscibeOpenPosition');
        await utils.sleep(2000);
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
                        this.ClosedPosition(update);;
                        
                    });
                }
            }else
                throw new Error("Error status[" + statusCode + "][" + err  +"]"); //inside callback 
        }catch (e)
        {
            store.set("subscibeClosedPosition","0");
	        console.log('subscibeClosedPosition() subscribe request #', requestID, ' JSON parse error: ', e);
        }
    };    
    let action = store.get('subscibeClosedPosition');
    if (typeof action === 'undefined')
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




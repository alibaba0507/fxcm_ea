
var rep = require('./repository');
var store = require('./repository').store
var conn = require('./fxcm_connect');
let storeKey = require('./repository').storeKey;

module.exports.sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
  }
module.exports.subscibe = async () => {
	var callback = (statusCode, requestID, data,err,indx,socket) => {
		if (statusCode === 200 && data && data != '') {
			try {
				var jsonData = JSON.parse(data);
				let id = store.get('subscribe');
				/*console.log(' >>>>> SUBSCRIBE reqId[' + requestID 
						+ '] satatus [' + statusCode + '] data [' 
						+ data + '] ID [' + id + '] >>>>>>>>>>>>>>>>>>')
				*/
				if (id != requestID)
				{
					store.set('subscribe',requestID);
				}
			} catch (e) {
				console.log('subscribe request #', requestID, ' JSON parse error: ', e , ' data ',data);
				store.set('subscribe',"0");
				mail('FXCM Pair subscribe Error','subscribe request #'+ requestID+ ' JSON parse error: '+ e + ' data '+data)
				return;
			}
			if(jsonData.response.executed) {
				try {
					for(var i in jsonData.pairs) {
						socket.on(jsonData.pairs[i].Symbol, this.priceUpdate);
					}
				} catch (e) {
					console.log('subscribe request #', requestID, ' "pairs" JSON parse error: ', e);
					store.set('subscribe',"0");
					return;
				}
			} else {
				console.log('subscribe request #', requestID, ' not executed: ', jsonData);
			    store.set('subscribe',"0");
			}
		} else {
			store.set('subscribe',"0");
			console.log('subscribe request #', requestID, ' execution error: ', statusCode, ' : Err', err);
		}
    }
    let trading = store.get(storeKey.trading);
    //trading[indx].pair
    if (trading) {
        trading = JSON.parse(trading);
    
        let p = new Array();
        for (let i = 0; i < trading.length; i++) {
            p.push(trading[i].pair)
        }
        console.log(' >>>>>> push ', p);
        let pairs = JSON.stringify(p);
        console.log(' >>>>>> PAIRS TO SUBSCRIBE >>>>> ',pairs);
        let action = store.get('subscribe');
        if (typeof action === 'undefined')
        {
            conn.authenticate('{ "method":"POST", "resource":"/subscribe", "params": { "pairs":' + pairs + '}}', callback );
            await this.sleep(2000);
        }else if (action == "0")
        {	// something went wrong we will try again
            await conn.authenticate('{ "method":"POST", "resource":"/unsubscribe", "params": { "pairs":' + pairs + '}}');
            store.delete('subscribe');
            await this.sleep(2000);
            this.subscibe();
        }  
    }
	

	   
		//cli.emit('send',{ "method":"POST", "resource":"/subscribe", "params": { "pairs":pairs }, "callback":callback })

}

module.exports.loadCandles = async (indx = 0, histCandles = 3500) =>{
    let res = {};
    try{
        let loadPairs = store.get(rep.storeKey.trading);
        if (loadPairs && indx < JSON.parse(loadPairs).length) 
        {
            loadPairs = JSON.parse(loadPairs);
            //console.log(' >>>>>>>> loadHistCandles LOADED PAIRS >>>>',loadPairs);
            let candles = store.get(loadPairs[indx].pair);
            if (typeof candles === 'undefined')
               return {"eer":"No candles for pair [" + loadPairs[indx].pair+"]"};

            jsonCandles = JSON.parse(candles);
            jsonCandles.sort((a, b) => {
                return (b[0] - a[0]); // sort decending by time where newest time is first
            });
            if (candles.length < histCandles - 1) {
                resultInMinutes = (histCandles) - candles.length;
              } else {
                let now = new Date();
                let d = new Date(Number(jsonCandles[0][0]) * 1000);
               // console.log('############### LAST DATE FROM STORE ', d.toUTCString());
                let difference = now.getTime() - d.getTime(); // This will give difference in milliseconds
                resultInMinutes = Math.round(difference / (60000 * 5)); // 
                let l = Math.min(candles.length - 1, 20);
                for (let j = 1; j < 20; j++) {
                  d = new Date(Number(jsonCandles[j][0]) * 1000);
                  difference = now.getTime() - d.getTime(); // This will give difference in milliseconds
                  let res = Math.round(difference / (60000 * 5));
                  if (res > j + 1 || res < j - 1) {
                    resultInMinutes = histCandles;
                    console.log(' ************** CANDLE OUT OF SYNCHRONIZATION '
                      + '[' + loadPairs[indx].pair + '] CANDLE [' + j
                      + ']DIFF[' + res + ']CANDLE TIME [' + d.toString()
                      + ']CURRENT[' + now.toString()
                      + '] ************');
                    break;
                  }
                }//end for (let j = 1; j < 20; j++)
              }// end if (candles.length < histCandles - 1)
              if (Number(resultInMinutes) > 0) { // retreving candles
                let cmd = '{ "method":"GET", "resource":"/candles/' + loadPairs[indx].id + '/m5", "params": { "num":' + resultInMinutes + ' } }'
                console.log('>>>>> SENDING ', cmd);
                let result = await conn.authenticate(cmd);
                if (typeof result.error === 'undefined' && result.data)
                {
                   await updateCandles(result.data, jsonCandles, histCandles, loadPairs[indx].pair);
                }
              }
        }else{
            res.err = "Invalid index prameter[" + indx + "] or pairs is null";
        }
    }catch (e)
    {
      res.err = e;
    }finally{
        return res;
    }
}

module.exports.priceUpdate = async (update) => {
	try {
	
        var jsonData = JSON.parse(update);
       // console.log(jsonData);
		let candles = store.get(jsonData.Symbol.toString());
		if (candles) candles = JSON.parse(candles);
		else {return;}
		// JavaScript floating point arithmetic is not accurate, so we need to round rates to 5 digits
		// Be aware that .toFixed returns a String
		jsonData.Rates = jsonData.Rates.map(function(element){
			return element.toFixed(5);
		});
	
		let now = new Date();
		let newCandle = false;
		newCandle =((new Date(Number(jsonData.Updated)).getMinutes() % 5) == 1);
		if (newCandle == true && candles && candles.length > 0)
		{
			newCandle =  (new Date(Number(jsonData.Updated)).getMinutes()
			       != new Date(Number(candles[0][0])*1000).getMinutes());
		}
		if (newCandle == true && candles && candles.length > 0)
		{
			//if (candles && candles.length > 0)
			//{
				console.log('  ++++++++ ###### @@@@@@@@ ====[' + jsonData.Symbol.toString() 
				+ '] [' + 
			  	new Date(Number(jsonData.Updated)).getMinutes()
				 	+ '][' + new Date(Number(candles[0][0])*1000).getMinutes() 
				 	+ '] CANDLES [' + candles.length + ']==========');
			//}
			let cndl = new Array();
			cndl.push(Number(jsonData.Updated)/1000);
			cndl.push(jsonData.Rates[0]);
			cndl.push(jsonData.Rates[0]);
			cndl.push(jsonData.Rates[0]);
			cndl.push(jsonData.Rates[0]);
			cndl.push(jsonData.Rates[1]);
			cndl.push(jsonData.Rates[1]);
			cndl.push(jsonData.Rates[1]);
			cndl.push(jsonData.Rates[1]);
			//cndl.push('Y');// mark we been here
			candles.unshift (cndl);// add item at the begining of array
			//console.log(' ><<<<<<< CANDLE [' + candles[0][9] + '>>>>>>');
			store.set(jsonData.Symbol.toString(),JSON.stringify(candles));
			//store.candleParams.
		}else if (candles)
		{
		//	if ((now.getMinutes() % 5) != 0)
		//	  candles[0][9] = '';
			candles[0][0] = Number(jsonData.Updated)/1000;
			candles[0][2] = jsonData.Rates[0]; // close Bid
			candles[0][6] = jsonData.Rates[0]; // close Ask

			if (Number(candles[0][3]) < Number(jsonData.Rates[0]))
			 {candles[0][3] = jsonData.Rates[0]}
			 if (Number(candles[0][7]) < Number(jsonData.Rates[1]))
			 {candles[0][7] = jsonData.Rates[1]}
			
			if (Number(candles[0][4]) > Number(jsonData.Rates[0]))
			 {candles[0][4] = jsonData.Rates[0]}
			 if (Number(candles[0][8]) > Number(jsonData.Rates[1]))
			 {candles[0][8] = jsonData.Rates[1]}
			 store.set(jsonData.Symbol.toString(),JSON.stringify(candles));
		}
		/*if (candles)
		{
		let d = new Date(Number(candles[0][0])*1000);
		let l = candles.length;
	  store.store.set(jsonData.Symbol.toString() + '_candleUpdate',now.getTime());
		//console.log('@[' + l + '][' + d.toUTCString() + '] ] Price update of [' + jsonData.Symbol + 
	  //                ']: [' + candles[0][store.candleParams.BidClose] + ']');
		}*/
	//	else 
	//	    console.log(`@[${jsonData.Updated}] Price update of [${jsonData.Symbol}]: ${jsonData.Rates}`);
	} catch (e) {
		console.log('price update JSON parse error: ', e);
		return;
	}
}
async function updateCandles (data, jobj, cndlCount, element)  {
    let dt = JSON.parse(data);
    // this is new Candles
    let candles = dt.candles;
    // add candles from store into new canldes
    if (jobj)
      candles = candles.concat(jobj);
    // sort them by time desc (new time first)
    candles = candles.sort((a, b) => { return (b[0] - a[0]); });
    // remove duplicates
    candles = candles.filter(function (item, index) {
      if (index < candles.length - 1) {
        return item[0] != candles[index + 1][0];
      } else
        return true;
  
    });
  
    /*if (candles.length > cndlCount)
    {
      // if candles are more then 150 delete the rest
      var diff = candles.length - cndlCount;
      candles = candles.splice(0, candles.length - diff);
      console.log('>>>>>>>>>> SLICE ARRAY ',diff);
    }//end  if (candles.length > 150)
                // Save new Candles
    */
    if (element) {
      store.set(element, JSON.stringify(candles));
      console.log(' ??????????????????????? [' + element + '][' + candles[0] + '][' + candles[1] + '] &&&&&&&&&&&&&&&&&');
    }
  }

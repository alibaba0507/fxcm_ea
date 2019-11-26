let fs = require('fs');
let express = require( 'express' ) ;
let bodyParser     =        require("body-parser");
let nunjucks = require( 'nunjucks' ) ;
let cron = require('node-cron');
let https = require('https');
let http = require('http');
let path = require('path');
let templates = require('./fxcm_template');
let utils = require('./utils');
let candles = require('./fxcm_data');
let rep = require('./repository');
let storeKey = require('./repository').storeKey;
let orders =  require('./fxcm_orders');
let app = express() ;

let ping_url =  rep.config.server_url + '/ping';// 'http://localhost:8080/ping';
//app.use('html', [path.join(__dirname, 'html')]);
app.use(express.static(__dirname + './html'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

let PATH_TO_TEMPLATES = './html' ;
nunjucks.configure( PATH_TO_TEMPLATES, {
    autoescape: true,
    express: app
} ) ;

app.post("/open_order",async (req,res)=>{
   
  //req.url = "/open_orders_291267?ord=";// + JSON.stringify(result);
    //app.handle(req, res);
    let url = "";
    if (Number(req.body.lots) > 0)
    {
      let openResult = await orders.openOrder(req.body.pair,(req.body.type == 1),Number(req.body.lots));
      //let openResult = {pair:req.body.pair,type:(req.body.type == 1)?"BUY":"SELL"
       //               ,openAt:price,lots:Number(req.body.lots)} ;
      url = "/open_orders_291267?ord=" + JSON.stringify(openResult);
    }
    //let url = "/open_orders_291267?ord='<b>Redirect From open order form'";
    //app.handle(req, res);
    res.redirect( url);
} );

app.post("/open_future",async (req,res)=>{
   
  //req.url = "/open_orders_291267?ord=";// + JSON.stringify(result);
    //app.handle(req, res);
    let url = "";
    if (Number(req.body.abovePrice) > 0 
         && Number(req.body.bellowPrice) > 0)
         {
           url = "/openFuture?pair=" + req.body.pair+ "&type=" + req.body.type 
          + "&lots=" + req.body.lots + "&err='Please Select only Above or Bellow price'";
          //app.handle(req, res);
          
         }else
         {
          let candles = rep.store.get(req.body.pair);
          if (candles)
          {
            jsonCandles = JSON.parse(candles);
           // console.log(' >>>>>>>> loadHistCandles LOADED Count [' + jsonCandles.length  +"]>>>>>>");
            jsonCandles.sort((a, b) => {
                return (b[0] - a[0]); // sort decending by time where newest time is first
            });
         
          let loadPairs = rep.store.get(rep.storeKey.trading);
          loadPairs = JSON.parse(loadPairs);
          let p = loadPairs.find((e)=>{return e.pair == req.body.pair});
          let price = (req.body.type == 1) ? 
                Number(jsonCandles[0][rep.candleParams.AskClose])
                : Number(jsonCandles[0][rep.candleParams.BidClose])
          if (Number(req.body.abovePrice))
                 price +=  (Number(req.body.abovePrice) / Number(p.digits));
          if (Number(req.body.bellowPrice))
                 price -=  (Number(req.body.bellowPrice) / Number(p.digits));
          let openResult = await orders.openPendingPossition(req.body.pair,price,(req.body.type == 1),Number(req.body.lots));
          //let openResult = {pair:req.body.pair,type:(req.body.type == 1)?"BUY":"SELL"
           //               ,openAt:price,lots:Number(req.body.lots)} ;
          url = "/open_orders_291267?ord=" + JSON.stringify(openResult);
          //app.handle(req, res);
          
          }else
          {
            url = "/open_orders_291267?ord='Can not FIND CANDLE DATA for [" + req.body.pair + "] '";
          }
        }
        res.redirect( url);
   
} );


app.post("/update_token", async (req,res)=>{
  try{
   if (req.body.token)
   {
       // we must save token
       //fs.writeFileSync('token.txt', req.body.token);
       let token = req.body.token;
       let server = req.body.server_url;
       let minLot = req.body.minLots;
       let maxLot = req.body.maxLots;
       if (token && token.length > 0)
        rep.config.token = token.trim();
       if (server && server.length > 0)
        rep.config.server_url = server;
       if (minLot && Number(minLot) > 0)
         rep.config.minLot = minLot;
        if (maxLot && Number(maxLot) > 0)
          rep.config.maxLot = maxLot;

      // await candles.subscibe(true);
   }
   //return res.send('<b>Token has been saved');
   let url = "/open_orders_291267?ord='<b>Token has been saved'";
   //app.handle(req, res);
   res.redirect( url);
  }catch (e)
  {
     console.log(e.stack);
      return res.send('<b>Error saving token ' + e.toString());
  }

})


app.get( '/close', async function( req, res ) {
  let ord = require('./fxcm_orders');
  if (req.query.tradeId)
  {
    let selectedOrder = await ord.orderByTradeId(req.query.tradeId);
    let result = await ord.closeOrder(selectedOrder);
    let url = "/open_orders_291267?ord=" + JSON.stringify(result);
    res.redirect( url);
    //res.send(' <b> After Closing order ..... <br>' + JSON.stringify(result));
  }else
    res.send(' <b> Missing TradeId Parameter.....');
});


app.get( '/open_orders_291267', async ( req, res )=> {
  //await require('./fxcm_orders').updateOpenPositions();
  let openPos = await templates.createOrderTemplate();
 // await templates.macdSignalToEmail(openPos);
  console.log(" >>>>>> get Info ",openPos);
  //let clientData = !{ JSON.stringify(openPos) };
  let ordInfo =  (req.query.ord)? (req.query.ord):"";
  return res.render( 'index.html',{
      orderInfo:ordInfo,
      open_positions:openPos
  });
});
app.get( '/ping', function( req, res ) {
    console.log(' >>>>>>> Calling Ping Server ....');
    res.send(' <b> Ping Success .....');
  });

  app.get( '/open', function( req, res ) {
    return res.render( 'openForm.html',{
      pair:req.query.pair,
      type:req.query.type,
      lots:rep.config.minLot,
      maxLot:rep.config.maxLot
  });
  });

  app.get( '/openFuture', function( req, res ) {
    let err = "";
    if (req.query.err)
     err = req.query.err;
    return res.render( 'openFutureForm.html',{
      pair:req.query.pair,
      type:req.query.type,
      lots:rep.config.minLot,
      err:err
  });
  });



  app.get( '/settings_291267', function( req, res ) {
    console.log(' >>>>>>> Calling Settings Server ....');
    return res.render( 'token.html',{
      token:rep.config.token,
      server:rep.config.server_url,
      minLot:rep.config.minLot,
      maxLot:rep.config.maxLot
  });

  });


  



  var task = cron.schedule('* * * * *', async () => {
   
    console.log(' >>>>> PING SERVER EVERY 1 MIN WORKER ....>>>>>');
     //updateCandles();
     const myURL = new URL(ping_url);
     //console.log("PROTOCOL [" + myURL.protocol + "]");
     if (myURL.protocol == 'http:')
     {
        http.get(ping_url, (resp) => {
            let htmlData = '';
            resp.on('data', (chunk) => {htmlData += chunk;});
            resp.on('end', () => { /* console.log(JSON.parse(data).explanation);*/});
            }).on("error", (err) => { console.log("Error: " + err.message);
        });
     }else
     {
        https.get(ping_url, (resp) => {
            let htmlData = '';
            resp.on('data', (chunk) => {htmlData += chunk;});
            resp.on('end', () => { /* console.log(JSON.parse(data).explanation);*/});
            }).on("error", (err) => { console.log("Error: " + err.message);
        });
    }
    if ((new Date().getMinutes() % 5) == 0) {
      console.log(' >>>>> PING SERVER EVERY 5 MIN WORKER ....>>>>>');
      rep.store.set("updateOpenPosition",1);
      await updateCandles();  
      //await templates.checkForEmailSignal();
     // await templates.macdSignalToEmail();
    }
  });
 


  async function updateSotreParams () {
    try {
  
      let savedPairs = fs.readFileSync('pairs.txt').toString();
  
      if (savedPairs && savedPairs != '') {
        savedPairs = JSON.parse(savedPairs);
        rep.store.set(storeKey.trading, savedPairs.trading);
        rep.store.set(storeKey.minLots, (savedPairs.minLots));
        rep.store.set(storeKey.maxLots, (savedPairs.maxLots));
        console.log(' =========== UPDATE STORE WITH TRADE PAIRS AND LOTS ======', savedPairs);
        //fs.writeFileSync('pairs.txt', JSON.stringify(savedPairs));
        //updatePairs(true);// unsubscribe
      }
  
    } catch (e) {
      console.log(' >>>> ERROR GET updateSotreParams ', e);
    }
  }

  async function updateCandles  (){
    let trading = rep.store.get(storeKey.trading);
    if (!trading) { return; }
    trading = JSON.parse(trading);
    let loadPairs = rep.store.get(rep.storeKey.trading);
    loadPairs = JSON.parse(loadPairs);
   
   
    for (let i = 0;i < trading.length;i++)
    {
        let res = await candles.loadCandles(i,rep.candlesCount);
       // console.log(">>>>>> ##$$$ AFTER CANDLES @###### ",res);
        if (res.err)
        {
          console.log(" ERRRPRRRRRPOOOOORRRR LOAD CANDLE >>>>> SEND EMAIL");
          rep.mail("FXCM Socket Error","Error[" + res.err + "]<br>Message[" + res.msg + "]<br>");
          rep.store.set('subscribe',"0");
          return;
        }
        await utils.sleep(500);
    }
    await orders.updateOpenPositions();
    await utils.sleep(2000);
    //await ord
    console.log(" >>>>>>> $$$$$ BEOFRE SUPSCRIBE TO PRICE &&&&&&& ");
    candles.subscibe();
    
   // await utils.sleep(2000);
    //console.log(" >>>>>>> $$$$$ BEOFRE SUPSCRIBE TO OPEN POSSITIONS *************** &&&&&&& ");
    // orders.subscibeOpenPosition();
     await utils.sleep(2000);
     
     orders.subscibeClosedPosition();
     await utils.sleep(2000);
     
     console.log(" >>>>>>> $$$$$ BEOFRE createOrderTemplate() ************** &&&&&&& ");
     let openPos = await templates.createOrderTemplate();
     console.log(" >>>>>>> $$$$$ BEOFRE macdSignalToEmail() ************** &&&&&&& ");
    await templates.macdSignalToEmail(openPos);
    console.log(" >>>>>>> $$$$$ AFTER macdSignalToEmail() ************** &&&&&&& ");
    //await templates.bandsSignalToEmail(openPos);
    //await macd();
    
   //rep.mail('FXCM Test mail',"<b> This is is a test");
}


  app.listen(((process.env.PORT) ? process.env.PORT : 8080),async  () =>{
    console.log('Example app listening on port 8080. - ',process.env.PORT);
    //rep.mail("FXCM Socket Error","Error testing ddddd<br>");
    rep.store.set("updateOpenPosition",1);
    await updateSotreParams();
    await updateCandles();
    task.start();
    //let macd = await require('./alphavantage_ea').macd("EURUSD");
    //console.log(">>>>>>> MACD [EURUSD] ",macd);
});

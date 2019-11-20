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
let app = express() ;

let ping_url = 'http://localhost:8080/ping';
//app.use('html', [path.join(__dirname, 'html')]);
app.use(express.static(__dirname + './html'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

let PATH_TO_TEMPLATES = './html' ;
nunjucks.configure( PATH_TO_TEMPLATES, {
    autoescape: true,
    express: app
} ) ;


app.get( '/ping', function( req, res ) {
    console.log(' >>>>>>> Calling Ping Server ....');
    res.send(' <b> Ping Success .....');
  });

  app.get( '/open_orders_291267', async ( req, res )=> {
    await require('./fxcm_orders').updateOpenPositions();
    let openPos = await templates.createOrderTemplate();
    console.log(" >>>>>> get Info ",openPos);
    //let clientData = !{ JSON.stringify(openPos) };
    return res.render( 'index.html',{
        open_positions:openPos
    });
  });



  var task = cron.schedule('* * * * *', () => {
   
    console.log(' >>>>> PING SERVER EVERY 1 MIN WORKER ....>>>>>');
     //updateCandles();
     const myURL = new URL(ping_url);
     console.log("PROTOCOL [" + myURL.protocol + "]");
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
    if ((new Date().getMinutes() % 5) == 0) {updateCandles();  }
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
        await candles.loadCandles(i,rep.candlesCount);
        await utils.sleep(500);
    }
    await utils.sleep(2000);
    
    console.log(" >>>>>>> $$$$$ BEOFRE SUPSCRIBE TO PRICE &&&&&&& ");
    candles.subscibe();
    
    await utils.sleep(2000);
    
    //await macd();
    
   //rep.mail('FXCM Test mail',"<b> This is is a test");
}


  app.listen(((process.env.PORT) ? process.env.PORT : 8080),async  () =>{
    console.log('Example app listening on port 8080. - ',process.env.PORT);
    await updateSotreParams();
    await updateCandles();
    task.start();
});

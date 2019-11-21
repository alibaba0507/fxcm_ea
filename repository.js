"use strict";
//const scatteredStore = require('scattered-store');
const nodemailer = require("nodemailer");

const candlesCount = 5000;
const candleParams = {timestamp :0, BidOpen : 1
              , BidClose:2,BidHigh:3, BidLow:4
               , AskOpen:5, AskClose:6,
               AskHigh:7, AskLow:8
               ,TickQt:9}
const storeKey = {trading:'trading'
                 ,acc_sum:'acc_sum'
                 ,acc_offers:'acc_offers'
                ,open_possitions:'acc_open_positions'
                 , acc_orders:'acc_orders'
                 ,acc_closed_positions:'acc_closed_positions'
                 ,accounts:'accounts'
                 ,minLots: 'minLots',maxLots:'maxLots'};
const pairs = [
  {"pair": "EUR/USD","id": "1"},
{"pair": "USD/JPY","id": "2"},
{"pair": "GBP/USD","id": "3"},
{"pair": "USD/CHF","id": "4"},
{"pair": "EUR/CHF","id": "5"},
{"pair": "AUD/USD","id": "6"},
{"pair": "USD/CAD","id": "7"},
{"pair": "NZD/USD","id": "8"},
{"pair": "EUR/GBP","id": "9"},
{"pair": "EUR/JPY","id": "10"},
{"pair": "GBP/JPY","id": "11"},
{"pair": "CHF/JPY","id": "12"},
{"pair": "GBP/CHF","id": "13"},
{"pair": "EUR/AUD","id": "14"},
{"pair": "EUR/CAD","id": "15"},
{"pair": "AUD/CAD","id": "16"},
{"pair": "AUD/JPY","id": "17"},
{"pair": "CAD/JPY","id": "18"},
{"pair": "NZD/JPY","id": "19"},
{"pair": "GBP/CAD","id": "20"},
{"pair": "GBP/NZD","id": "21"},
{"pair": "GBP/AUD","id": "22"},
{"pair": "AUD/NZD","id": "28"},
{"pair": "USD/SEK","id": "30"},
{"pair": "EUR/SEK","id": "32"},
{"pair": "EUR/NOK","id": "36"},
{"pair": "USD/NOK","id": "37"},
{"pair": "USD/MXN","id": "38"},
{"pair": "AUD/CHF","id": "39"},
{"pair": "EUR/NZD","id": "40"},
{"pair": "USD/ZAR","id": "47"},
{"pair": "USD/HKD","id": "50"},
{"pair": "ZAR/JPY","id": "71"},
{"pair": "USD/TRY","id": "83"},
{"pair": "EUR/TRY","id": "87"},
{"pair": "NZD/CHF","id": "89"},
{"pair": "CAD/CHF","id": "90"},
{"pair": "NZD/CAD","id": "91"},
{"pair": "TRY/JPY","id": "98"},
{"pair": "USD/ILS","id": "100"},
{"pair": "USD/CNH","id": "105"},
{"pair": "AUS200","id": "1001"},
{"pair": "ESP35","id": "1002"},
{"pair": "FRA40","id": "1003"},
{"pair": "GER30","id": "1004"},
{"pair": "HKG33","id": "1005"},
{"pair": "JPN225","id": "1007"},
{"pair": "NAS100","id": "1008"},
{"pair": "SPX500","id": "1010"},
{"pair": "UK100","id": "1012"},
{"pair": "US30","id": "1013"},
{"pair": "Copper","id": "1016"},
{"pair": "CHN50","id": "1020"},
{"pair": "EUSTX50","id": "1035"},
{"pair": "USDOLLAR","id": "1058"},
{"pair": "US2000","id": "1060"},
{"pair": "USOil","id": "2001"},
{"pair": "UKOil","id": "2002"},
{"pair": "SOYF","id": "2003"},
{"pair": "NGAS","id": "2015"},
{"pair": "WHEATF","id": "2020"},
{"pair": "CORNF","id": "2021"},
{"pair": "Bund","id": "3001"},
{"pair": "XAU/USD","id": "4001"},
{"pair": "XAG/USD","id": "4002"},
{"pair": "XAU/EUR","id": "4005"},
{"pair": "XAU/AUD","id": "4006"},
{"pair": "XAU/TRY","id": "4007"},
{"pair": "ETH/USD","id": "8003"},
{"pair": "LTC/USD","id": "8004"}
];

/*
const store = scatteredStore.create('persist', (err) => {
    // This is optional callback function so you can know
    // when the initialization is done.
    if (err) {
      // Oops! Something went wrong.
      console.log(" ##### Error Init cattered-store ", err);
    } else {
      // Initialization done!
    }
  });
  */
 const store = new Map();
  /*
suportteam69@gmail.com	alida001
suportteams67@gmail.com	alida001
funny.guy2912@gmail.com	alida002
vundevt@gmail.com	alida004
fx2go4u@gmail.com	alida005
alibaba0507@gmail.com	alida004
jamesdone0507@gmail.com	alida001
jacobdone0507@gmail.com 	alida001
afiliate01@gmail.com	alida2912
  */
  let emails = [ 
    {
    user: 'suportteam693@gmail.com',
    pass: 'alida001'
    },
    {
      user:'alibaba0507@gmail.com',
      pass:'alida004'
     },
    {
      user: 'suportteam69@gmail.com',
      pass: 'alida001'
  },
  {
    user: 'funny.guy2912@gmail.com',
    pass: 'alida002'
},
{
  user: 'jamesdone0507@gmail.com',
  pass: 'alida001'
},
{
  user: 'jacobdone0507@gmail.com',
  pass: 'alida001'
},
{
  user: 'afiliate01@gmail.com',
  pass: 'alida2912'
}
];

var mail = (subject,htmlBody,indx) =>
{
    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: emails[0],/* {
               user: 'suportteam693@gmail.com',
               pass: 'alida001'
           }*/
           tls: {
            rejectUnauthorized: false
            }
       });
       const mailOptions = {
        from: emails[0].user,//'suportteam693@gmail.com', // sender address
        to: 'fx2go4u@gmail.com', // list of receivers
        subject: subject,//'FX Alert By Node JS Server', // Subject line
        html: htmlBody// emailHTML// plain text body
      };
      if (!indx)
        indx = 0;
      transporter.sendMail(mailOptions, function (err, info) {
        if(err)
        {
         console.log('>>>>>>>>>> ' + emails[indx].user + ' >>>>>>>> [' + indx + '] >>>>>>')   
         console.log(err)
         console.log(' >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> >>>>>>>')
         
         emails.push(emails.shift());
         if (indx < emails.length - 1)
          mail(subject,htmlBody,++indx);
        }
       /* else
          console.log(info);
        */
     }); 
};

  var config = {};
  config.server_url = "http:/localhost:8080";
  config.minLot = 2;
  config.maxLot = 6;
 //Y7JMSG0OG36LTWHP
  config.alphavantage_url = 'www.alphavantage.co/query?';
  config.alphavantage_proto = 'https';
  config.alphavantage_token = 'Y7JMSG0OG36LTWHP';
  config.alphavantage_load_candles = 'FX_INTRADAY';
  config.alphavantage_SMA = 'SMA';
  config.alphavantage_SAR = 'SAR';

  config.price_host = 'www.freeforexapi.com/api/live?pairs=';
  config.price_port = 80;
  config.trading_pairs = 'AUDUSD,EURUSD,GBPUSD,USDJPY,EURGBP,USDCHF,USDXAU';
  config.token = "73f3480646b5a43d8cb379724a2c8e7fc5e38858"; // get this from http://tradingstation.fxcm.com/
  config.trading_api_host = 'api.fxcm.com';
  config.trading_api_port = 443;
  config.trading_api_proto = 'https'; // http or https
  config.fxcm_acc = "92072406";
  
  module.exports.config = config;

  module.exports.store = store;
  module.exports.storeKey = storeKey;
  //module.exports.mail = nodemailer;
 // module.exports.emailLogin = emails;
  module.exports.mail = mail;
  module.exports.pairs = pairs;
  module.exports.candleParams = candleParams;
  
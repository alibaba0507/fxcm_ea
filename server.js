let fs = require('fs');
let express = require( 'express' ) ;
let bodyParser     =        require("body-parser");
let nunjucks = require( 'nunjucks' ) ;
let cron = require('node-cron');
let https = require('https');
let http = require('http');

let app = express() ;

let ping_url = 'http://localhost:8080/ping';

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

let PATH_TO_TEMPLATES = '.' ;
nunjucks.configure( PATH_TO_TEMPLATES, {
    autoescape: true,
    express: app
} ) ;


app.get( '/ping', function( req, res ) {
    console.log(' >>>>>>> Calling Ping Server ....');
    res.send(' <b> Ping Success .....');
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
    if ((new Date().getMinutes() % 5) == 0) {  }
  });


  app.listen(((process.env.PORT) ? process.env.PORT : 8080), function () {
    console.log('Example app listening on port 8080. - ',process.env.PORT);
    task.start();
});

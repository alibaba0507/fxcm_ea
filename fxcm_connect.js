/**
 *  This is connection module, will establish socket connection
 * to fxcm to query or subscribe to fxcm tables , 
 * if callback is define will send back socket object , 
 * which is important for subscription.
 * callback(response.statusCode, requestID, data,error,indx,socket)
 * @module.exports.authenticate
 */
var io = require('socket.io-client');
var store = require('./repository');
var querystring = require('querystring');
var tradinghttp = require(store.config.trading_api_proto);
var globalRequestID = 1;
var request_headers = {
	'User-Agent': 'request',
	'Accept': 'application/json',
	'Content-Type': 'application/x-www-form-urlencoded'
}


/**
 *  With async will give a option to be async 
 * function if we call it with await authenticate(...)
 * this is not recomended for subscription cause will cause
 * lock of all program
 * @param {*} command 
 * @param {*} callback - callback(response.statusCode, requestID, data,error,indx,socket);
 * @param {*} indx 
 */
module.exports.authenticate = async (command,callback,indx=0) =>{
	let socket;
	try{
		if (!store.config.token || store.config.token.length <= 0)
		{
			store.config.token = require('fs').readFileSync('token.txt').toString();
			store.config.token = store.config.token.split(/\r?\n/)[0]; // need only first line
		}
		console.log(" ######## TOLEN [" + store.config.token + '][' +command+'] #########' );
		 socket = io(store.config.trading_api_proto + '://' + store.config.trading_api_host + ':' + store.config.trading_api_port, 
		{
			
			query: querystring.stringify({
					access_token: store.config.token
				})
		});
		if (typeof callback === 'undefined')
		{
			//callback = (statusCode,reqId,data,err,indx)=>{
				//		return {"statusCode":statusCode,"reqId":reqId,"data":data,"error":err,"id":socket.id,"soket":socket};
			//		};
			return await socketProccess(command , socket,indx);
		}
		// fired when socket.io connects with no errors
		socket.on('connect', () => {
			console.log('Socket.IO session has been opened: ', socket.id);
			console.log('@@@@@@@ OPEN SOCKET ',command);
			request_headers.Authorization = 'Bearer ' + socket.id + store.config.token;
			processData(command,callback,indx,socket);
		});
		
		// fired when socket.io cannot connect (network errors)
		socket.on('connect_error', (error) => {
			console.log('Socket.IO session connect error: ', error);
			console.log('@@@@@@@ SOCKET ERROR ',command);
			//mail('Fxcm Alert Socket IO Error',error)
			callback(0,0,'',error);

		});
		// fired when socket.io cannot connect (login errors)
		socket.on('error', (error) => {
			console.log('Socket.IO session error: ', error);
			console.log('@@@@@@@ SOCKET ERROR ',command);
			callback(0,0,'',error);
		});
		// fired when socket.io disconnects from the server
		socket.on('disconnect', () => {
			console.log('Socket disconnected, terminating client.');
			console.log('@@@@@@@ SOCKET DISCONECT ',command);
			store.mail("FXCM Socket ERROR",'@@@@@@@ SOCKET DISCONECT '+ command)
			//process.exit(-1);
			callback(0,0,'','Socket disconnected, terminating client');
		});
	}catch (e)
	{
		return {"error":err,"id":socket.id,"soket":socket};
	}

}


async function socketProccess(command , socket,indx)
{
  return new Promise((resolve, reject) => {
	socket.on('connect', () => {
		console.log('Socket.IO session has been opened: ', socket.id);
		console.log('@@@@@@@ OPEN AWAIT SOCKET ',command);
		request_headers.Authorization = 'Bearer ' + socket.id + store.config.token;
		processData(command,(statusCode,reqId,data,err,indx)=>{
			resolve( {"statusCode":statusCode,"reqId":reqId
					,"data":data,"error":err
					,"id":socket.id,"soket":socket});
		},indx,socket);
	});

	socket.on('connect_error', (error) => {
		console.log('Socket.IO session connect error: ', error);
		console.log('@@@@@@@ SOCKET AWAIT ERROR ',command);
		//mail('Fxcm Alert Socket IO Error',error)
		resolve( {"error":error
					,"id":socket.id,"soket":socket});

	});

	socket.on('error', (error) => {
		console.log('Socket.IO session error: ', error);
		console.log('@@@@@@@ SOCKET AWAIT ERROR ',command);
		resolve( {"error":error
					,"id":socket.id,"soket":socket});
	});

	socket.on('disconnect', () => {
		console.log('Socket disconnected, terminating client.');
		console.log('@@@@@@@ SOCKET DISCONECT ',command);
		//process.exit(-1);
		//callback(0,0,'','Socket disconnected, terminating client');
		resolve( {"error":'Socket disconnected, terminating client'
					,"id":socket.id,"soket":socket});
	});

  });
}
/**
 * Use mainly to process and fileter @data argument 
 * which is command for fxcm server
 * @param {*} data 
 * @param {*} callback 
 * @param {*} indx 
 */
function processData(data,callback,indx,socket)
{
    var input = data.toString().trim();

	// if the line was empty we don't want to do anything
	if (input === '') {
		//cli.emit('prompt');
		return;
	}

	// split input into command and parameters
	var inputloc = input.search('{');
	if (inputloc === -1) {
		inputloc = input.length;
	}
	var command = input.substr(0, inputloc).trim();
    var params = input.substr(inputloc).trim();
    if (params.length > 0) {
        try {
                    //	cli.emit(command, JSON.parse(params));
                //	console.log(" >>>>>>>>>>>>> SENDING ",params);
          var jPrams = JSON.parse(params);
                        //jPrams.callback = callback;
                        console.log(" >>>>>>>>>>>>> SENDING ",jPrams);
           send(jPrams,callback,indx,socket);    
    } catch (e) {
            console.log('could not parse JSON parameters: ', e);
        }
    } 
}


/**
 * More filtering of @params argument 
 * @param {*} params 
 * @param {*} callback 
 * @param {*} indx 
 */
function send (params,callback,indx,socket)
{
    if (typeof(params.params) === 'undefined') {
		params.params = '';
	}
	// method and resource must be set for request to be sent
	if (typeof(params.method) === 'undefined') {
        console.log('command error: "method" parameter is missing.');
        callback(0,0,undefined,'command error: "method" parameter is missing[' + JSON.toString(params) + ']',0);
	} else if (typeof(params.resource) === 'undefined') {
        console.log('command error: "resource" parameter is missing.');
        callback(0,0,undefined,'command error: "method" parameter is missing[' + JSON.toString(params) + ']',0);
	} else {
	   // console.log('@@@@@ Calling ', params.method);
	//	console.log('@@@@@ CallBACK <<<<<< ', callback);
		params.params = querystring.stringify(params.params);
	//	console.log('@@@@@ PARAMS <<<<<< ', 	params.params);
		request_processor(params.method, params.resource, params.params, callback,indx,socket);
		//console.log('@@@@@ AFTER CallBACK <<<<<< ');
	}
}


function request_processor (method, resource, params, callback,indx,socket) {
    var requestID = getNextRequestID();
    try {
		
    /*
    if (typeof(callback) === 'undefined') {
		callback = default_callback;
		console.log('request #', requestID, ' sending');
    }
    */
    
	if (typeof(method) === 'undefined') {
		method = "GET";
	}

	// GET HTTP(S) requests have parameters encoded in URL
	if (method === "GET") {
		resource += '/?' + params;
	}
	console.log(" +++++++++++++++ URL ",resource);
	var req = tradinghttp.request({
			host: store.config.trading_api_host,
			port: store.config.trading_api_port,
			path: resource,
			method: method,
			headers: request_headers
		}, (response) => {
			var data = '';
			response.on('data', (chunk) => data += chunk); // re-assemble fragmented response data
			response.on('end', () => {			   
                let jObj = JSON.parse(data).response;
                if (jObj.executed == false)
                {
                    callback(response.statusCode, requestID, '',jObj.error,indx,socket);
                }else
                    callback(response.statusCode, requestID, data,null,indx,socket);
                console.log(' ++++++++++ After CallBack ++++++++++++');
				
			});
		}).on('error', (err) => {
			//mail('Fxcm request Error [' + params + '] - ',err)
           // if (typeof(callback) !== 'undefined') 
			//{
                callback(0, requestID, err);
            //} // this is called when network request fails
            //else{console.log(" FXCM RESP ",err);}
        });

	// non-GET HTTP(S) reuqests pass arguments as data
	if (method !== "GET" && typeof(params) != 'undefined') {
		req.write(params);
	}
	console.log('  $$$$$$$$$$$ END OF REQ BEFORE CLOSING &&&&&&&');
	req.end();
} catch (e) {
	  //mail('Fxcm request Error [' + params + '] - ',e)
     console.log(e);
     callback(0, requestID, e);
}
}

function getNextRequestID () {
	return globalRequestID++;
};




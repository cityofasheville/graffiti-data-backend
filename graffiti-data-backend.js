var json2csv = require('json2csv');
var http = require('http');
var fs = require('fs');

//The application function flow: recursiveSetTimeout>httpResponseCallback>filterAndFlattenResponseFromPubstuff>generateOutputs

//Configure App Here

var appConfig = {
  //Example URL : 'www.random.org/integers/?num=1&min=1&max=10&col=1&base=10&format=plain&rnd=new'
  //urlHost is the host name of the url e.g. 'www.random.org'
  urlHost : 'www.publicstuff.com',
  //urlPath is the rest of the url e.g. '/integers/?num=1&min=1&max=10&col=1&base=10&format=plain&rnd=new'
  urlPath : '/api/2.0/requests_list?&after_timestamp=1401595200&api_key=i952rk495itu254sx21141j2d3je3x&limit=1000&request_type_id=11339&return_type=json&status=all&verbose=1',
  //interval is the interval that the application will wait before making another http request 
  interval : 60000,
  //Path to data folder on Apache server
  pathToWriteOutputs : '../htdocs/Graffiti-Dashboard/data/',
  //
  totalParticpatingRequestsFileName : "TotalParticpatingRequests",
  openParticpatingRequestsFileName : "OpenParticpatingRequests",
  completedParticpatingRequestsFileName : "CompletedParticpatingRequests",
  //These are the fields that will be used in the CSV files and HTML tables for total and completed participating requests
  totalParticpatingRequestsFields : [
    'RequestID',
    'Status',
    'Address',
    'DateCreated', 
    'DateClosed', 
    'Description',
    'ParticipantPropertyType',
    'AdditionalInformation',
    'InvestmentByCity',
    'CostToPropertyOwner',
    'WorkOrderNumber'
  ],
  //These are the fields that will be used in the CSV file and HTML table for open participating requests
  openParticpatingRequestsFields : [
    'RequestID',
    'Status',
    'Address',
    'DateCreated', 
    'Description',
    'ParticipantPropertyType',
    'AdditionalInformation',
  ]
};

//Set http Options
var httpOptions = {
  host: appConfig.urlHost,
  path: appConfig.urlPath
}

//Writes a CSV from JSON
var makeCsvFileFromJson = function(json, fields, path, filename){
  var pathWithFileName = path + filename + '.csv';
  json2csv({data: json, fields: fields}, function(err, csv) {
    if (err) console.log(err);
    fs.writeFile(pathWithFileName, csv, function(err) {
      if (err) throw err;
      console.log(pathWithFileName + "write complete at " + new Date().toString());
    });
  });
}

//Write a JavaScript file with variable set equal to a variable, like var [variableName] = [json]
var makeJsFileFromJsObjectAndVariableName = function(json, variableName, path, filename){
  var pathWithFileName = path + filename + '.js';
  var string2write = "var " + variableName + "=" + JSON.stringify(json);
  fs.writeFile(pathWithFileName, string2write, function(err) {
      if(err) {
         console.log(err);
      } else {
         console.log(pathWithFileName + "write complete at " + new Date().toString());
      }
  });
}

var makeJsonFileFromJson = function(json, path, filename){
  var pathWithFileName = path + filename + '.json';
  var string2write = JSON.stringify(json);
  fs.writeFile(pathWithFileName, string2write, function(err) {
      if(err) {
         console.log(err);
      } else {
         console.log(pathWithFileName + "write complete at " + new Date().toString());
      }
  });
}


var generateOutputs = function(filteredJson){
  //Make a CSV file of all of the participating requests
  makeCsvFileFromJson(filteredJson, appConfig.totalParticpatingRequestsFields, appConfig.pathToWriteOutputs, appConfig.totalParticpatingRequestsFileName);
  //Make a JS file of all of the participating requests with the variable totalParticpatingRequests
  makeJsFileFromJsObjectAndVariableName(filteredJson, 'totalParticpatingRequests', appConfig.pathToWriteOutputs, appConfig.totalParticpatingRequestsFileName);
  //Make a JSON file of all of the participating requests
  makeJsonFileFromJson(filteredJson, appConfig.pathToWriteOutputs, appConfig.totalParticpatingRequestsFileName);

  //Intialize an array to hold a flattened version of all of the open participating requests
  var openParticpatingRequestsFlattened = [];
  //Intialize an array to hold a flattened version of all of the completed participating requests
  var completedParticpatingRequestsFlattened = [];

  //seperate open and completed requests
  for (var i = 0; i < filteredJson.length; i++){
    if(filteredJson[i].Status === 'completed'){
      completedParticpatingRequestsFlattened.push(filteredJson[i]);
    }else{
      openParticpatingRequestsFlattened.push(filteredJson[i])
    }
  };

  //Make a CSV file of all of the open participating requests
  makeCsvFileFromJson(openParticpatingRequestsFlattened, appConfig.openParticpatingRequestsFields, appConfig.pathToWriteOutputs, appConfig.openParticpatingRequestsFileName);
  //Make a JS file of all of the open participating requests with the variable totalParticpatingRequests
  makeJsFileFromJsObjectAndVariableName(openParticpatingRequestsFlattened, 'openParticpatingRequests', appConfig.pathToWriteOutputs, appConfig.openParticpatingRequestsFileName);
  //Make a JSON file of all of the open participating requests
  makeJsonFileFromJson(openParticpatingRequestsFlattened, appConfig.pathToWriteOutputs, appConfig.openParticpatingRequestsFileName);

  //Make a CSV file of all of the completed participating requests
  makeCsvFileFromJson(completedParticpatingRequestsFlattened, appConfig.totalParticpatingRequestsFields, appConfig.pathToWriteOutputs, appConfig.completedParticpatingRequestsFileName);
  //Make a JS file of all of the completed participating requests with the variable totalParticpatingRequests
  makeJsFileFromJsObjectAndVariableName(completedParticpatingRequestsFlattened, 'completedParticpatingRequests', appConfig.pathToWriteOutputs, appConfig.completedParticpatingRequestsFileName);
  //Make a JSON file of all of the completed participating requests
  makeJsonFileFromJson(completedParticpatingRequestsFlattened, appConfig.pathToWriteOutputs, appConfig.completedParticpatingRequestsFileName);
}

//Filter the pubstuff JSON and flatten the JSON so that there is no nested objects
var filterAndFlattenResponseFromPubstuff = function(pubstuff){
  //Intialize an array to hold a flattened version of all of the participating requests
  var totalParticpatingRequestsFilteredAndFlattened = [];
  //Loop over pubstuff JSON to get the stuff we want
  for (var i = 0; i < pubstuff.response.requests.length; i++) {
    //store values for request i
    var request = {
      RequestID : pubstuff.response.requests[i].request.id,
      Status : pubstuff.response.requests[i].request.status,
      Address : pubstuff.response.requests[i].request.address,
      //UNIX timestamp, so convert to milliseconds and make a date string
      DateCreated : new Date(pubstuff.response.requests[i].request.date_created*1000).toDateString(),
      Description : pubstuff.response.requests[i].request.description
    }
    //date_closed property can either be a string 'null' or a UNIX timestamp
    if(pubstuff.response.requests[i].request.date_created === 'null'){
      request.DateClosed = "null"
    }else{
      //UNIX timestamp, so convert to milliseconds and make a date string
      request.DateClosed = new Date(pubstuff.response.requests[i].request.date_closed*1000).toDateString()
    }
    //Flatten the nested custom fields
    for(var x = 0; x < pubstuff.response.requests[i].request.custom_fields.length; x++){
      //store custom field value and name
      var cfValue = pubstuff.response.requests[i].request.custom_fields[x].custom_field.value;
      var cfName = pubstuff.response.requests[i].request.custom_fields[x].custom_field.name;
      if(cfName === "Graffiti Initiative Participant Property Type:"){
        request.ParticipantPropertyType = (cfValue === undefined)? "null" : cfValue; 
      }else if(cfName === "Additional Location Information and Notes:"){
        request.AdditionalInformation = (cfValue === undefined)? "null" : cfValue;
      }else if(cfName === "Investment by City ($):"){
        request.InvestmentByCity = (cfValue === undefined)? "null" : cfValue;
      }else if(cfName === "Cost to Property Owner ($):"){
        request.CostToPropertyOwner = (cfValue === undefined)? "null" : cfValue;
      }else if(cfName === "Work Order Number:"){
        request.WorkOrderNumber = (cfValue === undefined)? "null" : cfValue;
      }else{
        //Do nothing
      }
    }
    //We only want private property and pending requests
    if(request.ParticipantPropertyType === "3: Private Property" ||  request.ParticipantPropertyType === "0: Pending"){
      totalParticpatingRequestsFilteredAndFlattened.push(request)
    }
  };
  //Create output files from filtered and flattened data
  generateOutputs(totalParticpatingRequestsFilteredAndFlattened);
}


//Callback function to response from http request
httpResponseCallback = function(response) {
  var responseString = "";
    //another chunk of data has been recieved, so append it to `str`
    response.on('data', function (chunk) {
      responseString += chunk;
    });
    //the whole response has been recieved, so filter it
    response.on('end', function () {
      filterAndFlattenResponseFromPubstuff(JSON.parse(responseString)); 
    });
}

//Recursively make http requests at the interval of appConfig.interval
var recursiveSetTimeout = function(){
  http.request(httpOptions, httpResponseCallback).end();
  setTimeout(recursiveSetTimeout, appConfig.interval)
}

//This starts everything 
recursiveSetTimeout();

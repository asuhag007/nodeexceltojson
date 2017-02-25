 var express = require('express');
 var app = express();
 var bodyParser = require('body-parser');
 var multer = require('multer');
 var xlstojson = require("xls-to-json-lc");
 var xlsxtojson = require("xlsx-to-json-lc");
 var moment = require('moment');
 var fs = require('fs');
 var secondarrayjson = JSON.parse(fs.readFileSync('second_array.js', 'utf8')); // add file location here

 // console.log(secondarrayjson.records);
// console.log(moment().format("MM-DD-YY"));// for date we can use this moment format

 app.use(bodyParser.json());

 var storage = multer.diskStorage({ //multers disk storage settings
     destination: function(req, file, cb) {
         cb(null, './uploads/')
     },
     filename: function(req, file, cb) {
         var datetimestamp = Date.now();
         cb(null, file.fieldname + '-' + datetimestamp + '.' + file.originalname.split('.')[file.originalname.split('.').length - 1])
     }
 });

 var upload = multer({ //multer settings
     storage: storage,
     fileFilter: function(req, file, callback) { //file filter
         if (['xls', 'xlsx'].indexOf(file.originalname.split('.')[file.originalname.split('.').length - 1]) === -1) {
             return callback(new Error('Wrong extension type'));
         }
         callback(null, true);
     }
 }).single('file');

 /** API path that will upload the files */
 app.post('/upload', function(req, res) {
     var exceltojson;
     upload(req, res, function(err) {
         if (err) {
             res.json({
                 error_code: 1,
                 err_desc: err
             });
             return;
         }

         /** Multer gives us file info in req.file object */
         if (!req.file) {
             res.json({
                 error_code: 1,
                 err_desc: "No file passed"
             });
             return;
         }

         /** Check the extension of the incoming file and 
          *  use the appropriate module
          */

         if (req.file.originalname.split('.')[req.file.originalname.split('.').length - 1] === 'xlsx') {
             exceltojson = xlsxtojson;
         } else {
             exceltojson = xlstojson;
         }
         console.log(req.file.path);
         try {
             exceltojson({
                 input: req.file.path,
                 output: null, //since we don't need output.json
                 lowerCaseHeaders: true
             }, function(err, result) {
                 if (err) {
                     return res.json({
                         error_code: 1,
                         err_desc: err,
                         data: null
                     });
                 }

                 // console.log(result.length); use to check length of our excel doc
                 // console.log(secondarrayjson["records"].length); second array lenth
                 for (var i = 0; i < result.length; i++) {
                     for (var j = 0; j < secondarrayjson["records"].length; j++) {

                        if(result[i]["address"]==secondarrayjson["records"][j]["address"])
                        {
                            console.log("**** found this value matching to our second array ****");
                            console.log("Address from our excel file"+result[i]["address"]);
                            console.log("Address from our second array"+secondarrayjson["records"][j]["address"]);
                             
                            console.log("******* Info ******");
                            console.log("owner : "+secondarrayjson["records"][j]["owner"]);
                            console.log("county : "+secondarrayjson["records"][j]["county"]); 
                            console.log("statusalt : "+secondarrayjson["records"][j]["statusalt"]);
                            
                        }
                        // else{
                        //       console.log("not equal any"); 
                        // }

                     }
                 }

                 res.json({
                     error_code: 0,
                     err_desc: null,
                     data: result
                 });
             });
         } catch (e) {
             res.json({
                 error_code: 1,
                 err_desc: "Corupted excel file"
             });
         }
     })
 });

 app.get('/', function(req, res) {
     res.sendFile(__dirname + "/index.html");
 });

 app.listen('3001', function() {
     console.log('running on 3000...');
 });
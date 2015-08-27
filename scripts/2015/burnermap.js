xls = require("xls-to-json");

var nopt = require("nopt")
  , Stream = require("stream").Stream
  , path = require("path")
  , knownOpts = {
    "burnermap" : path,
    "out": path
  }
  , shortHands = {
     "b" : ["--burnermap"],
     "o" : ["--out"]
   }
  , parsed = nopt(knownOpts, shortHands, process.argv, 2)


xls({
    input: parsed.burnermap,  // input xls
    output: parsed.out // output json
  }, function(err, result) {
    if(err) {
      console.error(err);
    } else {
      console.log(result);
    }
  });

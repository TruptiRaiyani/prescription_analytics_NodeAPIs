var express = require('express');
var router = express.Router();
var mongo = require('mongodb');
 var str2json = require('string-to-json');

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'Express' });
});

router.get('/ICDCPT', function(req, res) {
    var db = req.db;
    var collection = db.get('ICDCPT');
    collection.find({},{},function(e,docs){

       res.json(docs); 
    });
});

router.get('/codeByCPT/:cpt', function(req, res) {

	var qstring = req.params.cpt.replace("=",":").replace("&",",");
	
    var db = req.db;
    var collection = db.get('ICDCPT');
    collection.find(str2json.convert(qstring),{},function(e,docs){
        res.json(docs); 
    });
});

router.get('/mybills/:userid', function(req, res) {
    var db = req.db;
    var collection = db.get('medicalbill');
    collection.find({"userid" : Number(req.params.userid)},{},function(e,docs){
       res.json(docs); 
    });
});
router.get('/getbillbybillid/:billid', function(req, res) {
    var db = req.db;
    var collection = db.get('medicalbill');
    collection.find({"medicalbillid" : Number(req.params.billid)},{},function(e,docs){
       res.json(docs); 
    });
});
router.get('/getbillbyid/:billid', function(req, res) {
 
    var db = req.db;
    var collection = db.get('medicalbill');

    collection.find({"medicalbillid" : Number(req.params.billid)},{},function(e,docs){

        var icdCount = docs[0].icd.length;
        var userid=docs[0].userid;
        var icd = docs[0].icd;
      // console.log( icd);
        for (var i =0; i < icdCount; i++)
        {
            var cptCount = icd[i].cpts.length;
             
            var cpts = icd[i].cpts;
         //  console.log(cpts);
            for(var j=0;j<cptCount;j++)
            {
                //var cpt = new var();
                 var cpt = cpts[j].cptcode;
                var cptbillcharge = cpts[j].charge;
                console.log(cptbillcharge);
                
                frauddetection(Number(cpt),icd[i].icdcode,cptbillcharge,Number(req.params.billid),Number(userid));
   

            }
        }
            function frauddetection(cpt,icd,cptbillcharge,billid,userid )
            {
                var collectionICDCPT = db.get('ICDCPT');
 collectionICDCPT.find({"cpt_code" : cpt ,"icd_code" : icd},{},function(e,docs1){

var cptmaxcharge ;
 if(docs1.length >=1)

        {
           
        if(docs1[0].amount <=100)
        {
        cptmaxcharge = Number(docs1[0].amount )+ (Number(docs1[0].amount) * 0.05) ;
      //  console.log("cptexpectcharge : " + cptmaxcharge);
        }
        else if(docs1[0].amount > 100 && docs1[0].amount <= 1000)
        {
  cptmaxcharge = Number(docs1[0].amount )+ (Number(docs1[0].amount) * 0.03) ;
      //  console.log("cptexpectcharge : " + cptmaxcharge);
        }
        else
        {
  cptmaxcharge = Number(docs1[0].amount )+ (Number(docs1[0].amount) * 0.01) ;
      //  console.log("cptexpectcharge : " + cptmaxcharge);
        }
         console.log("cptbillcharge " +cptbillcharge);
            console.log("maxcharge" + cptmaxcharge);
        if(cptbillcharge > cptmaxcharge)
            {console.log("fraud detected for  : " + cptbillcharge + " code : " + cpt);
        console.log(Number(cptbillcharge) - Number(docs1[0].amount));

var collectionFC = db.get('FraudRecordByCharges');

 collectionFC.find({"billid" : billid ,"userid" : userid, "cptcode" : cpt, "icdcode" : icd},{},function(e,docsFC){

if(docsFC.length ==0)
{
collectionFC.insert({"userid" : Number(userid),
"billid" : Number(billid),
"icdcode" : icd,
"cptcode" : cpt,
"originalamount" : docs1[0].amount ,
"amountcharged" : cptbillcharge,
"amountdiff" : Number(cptbillcharge) - Number(docs1[0].amount)
},function(err,doc){
if(err){
res.send("There was a problem adding the information to the database.");
}
else{
res.send(200,JSON.stringify({result:'true'}));
}
});

}
 });

    }
       
      // console.log(docs1);
       //console.log("done");
   }
   else
   {
    console.log("null found! ICD and cpt are not related : ICd " + icd + " cpt : " + cpt );
    var collectionFP = db.get('FraudRecordByProcedures');
collectionFP.find({"billid" : billid ,"userid" : userid, "cptcode" : cpt, "icdcode" : icd},{},function(e,docsFP){

if(docsFP.length == 0)
{
collectionFP.insert({"userid" : Number(userid),
"billid" : Number(billid),
"icdcode" : icd,
"cptcode" : cpt,
"amountcharged" : cptbillcharge
},function(err,doc){
if(err){
res.send("There was a problem adding the information to the database.");
}
else{
res.send(200,JSON.stringify({result:'true'}));
}
});
}
});
   }
    });
            }
        

       res.json(docs); 
    });

});
module.exports = router;

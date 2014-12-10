var express = require('express');
var router = express.Router();
var mongo = require('mongodb');
 var str2json = require('string-to-json');
require('date-utils');
var nodemailer = require("nodemailer");

 var smtpTransport = nodemailer.createTransport("SMTP",{
service: "Gmail",
auth: {
user: "raiyani.trupti@gmail.com",
pass: ""
}
});
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

router.get('/mybills/:emailid', function(req, res) {
    var db = req.db;
    var collection = db.get('medicalbill');
    collection.find({"emailid" : req.params.emailid},{},function(e,docs){
      console.log(docs);
       res.json(docs); 
    });
});
router.get('/getbillbybillid/:billid', function(req, res) {
    var db = req.db;
    var collection = db.get('medicalbill');
    collection.find({"medicalbillid" : Number(req.params.billid)},{},function(e,docs){
      console.log(docs);
       res.json(docs); 
    });
});
router.get('/getFraudById/:billid', function(req, res) {
 
    var db = req.db;
    var collection = db.get('medicalbill');

    collection.find({"medicalbillid" : Number(req.params.billid)},{},function(e,docs){

        var icdCount = docs[0].icd.length;
        var emailid=docs[0].emailid;
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
                
                frauddetection(Number(cpt),icd[i].icdcode,cptbillcharge,Number(req.params.billid),emailid);
   

            }
        }
            function frauddetection(cpt,icd,cptbillcharge,billid,emailid)
            {
                var collectionICDCPT = db.get('ICDCPT');
 collectionICDCPT.find({"cpt_code" : cpt ,"icd_code" : icd},{},function(e,docs1){

var cptmaxcharge ;

 if(docs1.length >=1)

        {
           
        if(docs1[0].amount <=100)
        {
        cptmaxcharge = Number(docs1[0].amount )+ (Number(docs1[0].amount) * 0.05) ;
         cptFraudLevelMin = Number(docs1[0].amount )+ (Number(docs1[0].amount) * 0.1) ;
          cptFraudLevelMax = Number(docs1[0].amount )+ (Number(docs1[0].amount) * 0.3) ;
      //  console.log("cptexpectcharge : " + cptmaxcharge);
        }
        else if(docs1[0].amount > 100 && docs1[0].amount <= 1000)
        {
  cptmaxcharge = Number(docs1[0].amount )+ (Number(docs1[0].amount) * 0.03) ;
   cptFraudLevelMin = Number(docs1[0].amount )+ (Number(docs1[0].amount) * 0.02) ;
   cptFraudLevelMax = Number(docs1[0].amount )+ (Number(docs1[0].amount) * 0.05) ;
      //  console.log("cptexpectcharge : " + cptmaxcharge);
        }
        else
        {
  cptmaxcharge = Number(docs1[0].amount )+ (Number(docs1[0].amount) * 0.01) ;
  cptFraudLevelMax = Number(docs1[0].amount )+ (Number(docs1[0].amount) * 0.05) ;
      //  console.log("cptexpectcharge : " + cptmaxcharge);
        }
         console.log("cptbillcharge " +cptbillcharge);
            console.log("maxcharge" + cptmaxcharge);
        if(cptbillcharge > cptmaxcharge)
            {
              console.log("fraud detected for  : " + cptbillcharge + " code : " + cpt);
        console.log(Number(cptbillcharge) - Number(docs1[0].amount));


/* code to be added begin */
var cptFraudLevelMin;
var cptFraudLevelMax;
var fraudlevel;
        if(cptbillcharge > cptmaxcharge && cptbillcharge < cptFraudLevelMin)
          fraudlevel = 'minor';
        else if(cptbillcharge > cptFraudLevelMin && cptbillcharge < cptFraudLevelMax)
          fraudlevel = 'moderate';
        else
          fraudlevel = 'major';

    var   fraudPercent =  (cptbillcharge /Number(docs1[0].amount)) * 100;
/* code to be added end */


var collectionFC = db.get('FraudRecordByCharges');

 collectionFC.find({"billid" : billid ,"emailid" : emailid, "cptcode" : cpt, "icdcode" : icd},{},function(e,docsFC){

if(docsFC.length ==0)
{
collectionFC.insert({"emailid" : emailid,
"billid" : Number(billid),
"icdcode" : icd,
"cptcode" : cpt,
"originalamount" : docs1[0].amount ,
"amountcharged" : cptbillcharge,
"amountdiff" : Number(cptbillcharge) - Number(docs1[0].amount),
"fraudlevel" : fraudlevel,
"fraudPercent" : fraudPercent,
"createddate" : Date.today()
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
collectionFP.find({"billid" : billid ,"emailid" : emailid, "cptcode" : cpt, "icdcode" : icd},{},function(e,docsFP){

if(docsFP.length == 0)
{
collectionFP.insert({"emailid" : emailid,
"billid" : Number(billid),
"icdcode" : icd,
"cptcode" : cpt,
"amountcharged" : cptbillcharge,
"createddate" : Date.today()
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






router.get('/EmailExists/:emailid',function(req,res){
var db = req.db;
var collection = db.get('user');
//console.log(req.params.emailid);
collection.find({'emailid':req.params.emailid},{},function(e,docs){
 
  if(docs[0] == null)
  {
     console.log("email does not exist");
res.json([{result:'false'}]);
}
else
{
   console.log("email exists");
res.json([{result:'true'}]);
}
});
});

router.get('/getUserByAccount/:emailid', function(req, res) {

 // var qstring = req.params.userinfo.replace("=",":").replace("&",",");
  
    var db = req.db;
    var collection = db.get('user');
  //  console.log(str2json.convert(req.params.userinfo));
   // var s= JSON.parse(qstring);
    //console.log(s);
    collection.find({'emailid' : req.params.emailid},{},function(e,docs){
       console.log(docs);
       if(docs[0] == null)
  {
     console.log("user does not exist");
res.json({user: 'notExists',result:'false'});
}
else
{
   console.log("user exists");
   console.log(docs[0].password);
   // var pwd = doc[0].password;
res.json({user: 'Exists',password:docs[0].password,username:docs[0].username,address:docs[0].address,securityqn:docs[0].securityqn,securityans:docs[0].securityans,userphno:docs[0].phno});
}
    });
});
router.get('/getUserByEmail/:emailid', function(req, res) {
   var db = req.db;
    var collection = db.get('user');
    collection.find({'emailid' : req.params.emailid},{},function(e,docs){
       console.log(docs);
        if(docs[0] == null)
  {
    res.json([{emailid : 'invalid'}]);
  }
  else
  {
       res.json(docs);
     }
     });
});
router.get('/getFradOnProcedureByBillID/:billid', function(req, res) {
   var db = req.db;
    var collection = db.get('FraudRecordByProcedures');
    collection.find({'billid' : Number(req.params.billid)},{},function(e,docs){
       console.log(docs);
       res.json(docs);
     });
});
router.get('/getFradOnChargeByBillID//:billid', function(req, res) {
   var db = req.db;
    var collection = db.get('FraudRecordByCharges');
    collection.find({'billid' : Number(req.params.billid)},{},function(e,docs){
       console.log(docs);
       res.json(docs);
     });
});

router.get('/ForgotPassword/:emailID',function(req,res){

    console.log("called");
var mailOptions={
to : req.params.emailID,
subject : "Password Reset",
text : "Prescription Analytics",
html: 'Dear User, <br><br><b>Please go to below link to chage your password.</b><br><br><b>http://localhost:8080/prescription_analytics/changePWDFromEmail.jsp</b><br><br>Thank You, <br>Prescription Analytics Team'
}
console.log(mailOptions);
smtpTransport.sendMail(mailOptions, function(error, response){
if(error){
console.log(error);
res.send([{er:"error"}]);
}else{
console.log("Message sent: " + response.message);
res.send([{er :"sent"}]);
}
});
});

router.post('/addUser',function(req,res){
var db = req.db;
var docs = JSON.parse(req.body.details);
var collection = db.get('user');
collection.insert(docs,function(err,doc){
if(err){
res.send("There was a problem adding the information to the database.");
}
else{
res.send(200,JSON.stringify({result:'true'}));
}
});
});
router.put('/updateUser/:emailid', function(req, res) {
    var db = req.db;
    var collection = db.get('user');
var docs = JSON.parse(req.body.details);
    // Submit to the DB
    collection.update({ "emailid":req.params.emailid},{
        $set : docs}, function (err, doc) {
        if (err) {
            res.send("There was a problem updating the information to the database.");
        }
        else {
            res.send(200, JSON.stringify({result:'true'}));       
        }
    });
});
/* POST to Add User Service */
router.delete('/deleteUser/:emailid', function(req, res) {
    var db = req.db;
    var collection = db.get('user');
    collection.remove( {"emailid": req.params.emailid}
       , function (err, doc) {
        if (err) {
            res.send("There was a problem removing the information from the database.");
        }
        else {
            res.send(200, JSON.stringify({result:'true'})); 
        }
    });
});
router.get('/getFradOnProcedureByUserID/:emailid', function(req, res) {
   var db = req.db;
    var collection = db.get('FraudRecordByProcedures');
    collection.find({'emailid' : req.params.emailid},{},function(e,docs){
       console.log(docs);
       res.json(docs);
     });
});
router.get('/getFradOnChargeByUserID/:emailid', function(req, res) {
   var db = req.db;
    var collection = db.get('FraudRecordByCharges');
    collection.find({'emailid' : req.params.emailid},{},function(e,docs){
       console.log(docs);
       res.json(docs);
     });
});


module.exports = router;

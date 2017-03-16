var db = require('../db/index');

exports.chart = function(req, res, next) {

  var data = '[{"username": "user1", "numberofawards": "3"}, {"username": "user2", "numberofawards": "5"} ]';

  var javascriptobject = JSON.parse(data);

  var jsonstring = JSON.stringify(data);

  //console.log("Username: " + data[0].username); //wrong if data is an string
  //console.log("Username: " + javascriptobject[0].username);

  //console.log("Username: " + jsonstring[0].username);

  res.render('Chart', { title: 'Chart', json: data });
  //res.render('chart', { title: 'chart', json: javascriptobject });
  //res.render('chart', { title: 'chart', json: jsonstring });

};

exports.getuserawardcount = function(req, res, next) {


  console.log("/getuserawardcount received");

  var resp = new Array();
  
  var i = 0;
  
  

  /*    //extra field awardcount in users table implementation
  db.all("SELECT id, username, awardcount FROM users", function(err, rows) {
    rows.forEach(function(row) {
      //console.log(row.id, row.username);
      resp[i] = new Object();
      resp[i].id = row.id;
      resp[i].username = row.username;
      resp[i].awardcount = row.awardcount;
      
      
      i = i + 1;
      
      
    })
    
    
    console.log("i: " + i);
    console.log("resp[0].username:" + resp[1].username);
    console.log(JSON.stringify(resp));
    



    //db.all('SELECT count(*) FROM entries WHERE user =  ', function(err, users) {


  });

  */


  db.all("SELECT user, users.username, count(user) AS count FROM entries LEFT OUTER JOIN users ON entries.user = users.id  GROUP BY user", function(err, rows) {
    rows.forEach(function(row) {
      //console.log(row.id, row.username);
      resp[i] = new Object();
      resp[i].id = row.user;
      resp[i].username = row.username;
      resp[i].awardcount = row.count;
      
      
      i = i + 1;
      
      
    })


  


    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(resp));

  });

  



 




};




exports.getemployeeawardcount = function(req, res, next) {


  console.log("/getemployeeawardcount received");

  var resp = new Array();
  
  var i = 0;
  
  

  /*    //extra field awardcount in users table implementation
  db.all("SELECT id, username, awardcount FROM users", function(err, rows) {
    rows.forEach(function(row) {
      //console.log(row.id, row.username);
      resp[i] = new Object();
      resp[i].id = row.id;
      resp[i].username = row.username;
      resp[i].awardcount = row.awardcount;
      
      
      i = i + 1;
      
      
    })
    
    
    console.log("i: " + i);
    console.log("resp[0].username:" + resp[1].username);
    console.log(JSON.stringify(resp));
    



    //db.all('SELECT count(*) FROM entries WHERE user =  ', function(err, users) {


  });

  */


  db.all("SELECT user, recipient, email, count(email) AS count FROM entries LEFT OUTER JOIN users ON entries.user = users.id  GROUP BY recipient", function(err, rows) {
    rows.forEach(function(row) {
      //console.log(row.id, row.username);
      resp[i] = new Object();
      resp[i].id = row.user;
      resp[i].username = row.recipient;
      resp[i].awardcount = row.count;
      
      
      i = i + 1;
      
      
    })


  


    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(resp));

  });

  



 




};

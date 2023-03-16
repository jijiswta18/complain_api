const express       = require('express');
const cors          = require('cors');
const moment        = require('moment');
const bodyParser    = require('body-parser');
const db            = require('./config/db');
const bcrypt        = require('bcrypt');
const jwt           = require('jsonwebtoken');
const ldap          = require('ldapjs');
const app           = express();


app.use(bodyParser.json());
app.use(cors({origin: '*'}));

moment.locale('th');
let date = moment().format('YYYY-MM-DD HH:mm:ss');



// ใช้งาน router module
const userApi       = require('./api/user');
const officerApi       = require('./api/officer');

// เรียกใช้งาน indexRouter
app.use('/api', [userApi, officerApi]);

// Create LDAP client connection 
const adConfiguration = {
  url: "ldap://" + process.env.ad_URL,
  reconnect: true,
}
const client = ldap.createClient(adConfiguration)
client.on('error', () => {
  // this will be your ECONNRESET message
})


app.get('/api', (req, res)=>{
    res.set('Content-Type', 'text/html');
    res.status(200).send("<h1>Hello GFG Learner!</h1>");
});

// function generateToken(payload) {
//   const token = jwt.sign(
//       { username : payload.userId },
//       process.env.JWT_KEY,
//       { expiresIn: "1h" }
//   )
//   return token;
// }

// function verifyToken(token) {
//   return jwt.verify(token, secretKey);
// }

// app.post('/api/login', async (req, res) =>{

//   try {
//     const username = await req.body.username
//     const password = await req.body.password

//     const hashedPassword = await bcrypt.hash(password, 10)

//     const sql = await 'SELECT * FROM user WHERE username = ?';


//     db.query(sql, username, async function (err, result, fields){

//       let user = await null

//       if(result){

//         user = await result[0]

//       }else{
//         res.status(400).send("error : no user in the system");
//       }

//       if(user){

//         const username_ad = await 'ad\\'+ user.username
//         console.log(username_ad);
//         console.log(password);

//         client.bind(username_ad, password, async err =>  {

//           let password = await false

//           if(err){
//             res.status(400).send("error : password error");
//           }else{
//             password =  await true
//             console.log("Success");
//           }

//         })

//         if(password){
//           console.log('=======');
//         }

//         // let password = ""
        
//         // if(password_ad){
//         //     password = hashedPassword

//         //     console.log("AD");
//         // }else{
//         //   console.log("");
//         // }

//         // if(password_ad){
//         //   const newToken = await generateToken({ userId: user.id });
//         //     let updateData = await {
//         //       "token"     : newToken,
//         //       "password"  : hashedPassword,
//         //   }
//         //   const sql_update = await 'UPDATE user SET ? WHERE username = ?'; 
  
//         //   db.query(sql_update, [updateData, username], function (err, result2, fields) {
  
//         //     return res.json({userdata: user, token: newToken})
    
//         //   });
//         // }


//       }

//     });


//   } catch (error) {
//     console.log(error)
//   }
// })

// app.post('/api/login', async (req, res) =>{

//   try {
//     const username = await req.body.username
//     const password = await req.body.password

//     const hashedPassword = await bcrypt.hash(password, 10)

//     const sql = await 'SELECT * FROM register WHERE username = ?';


//     db.query(sql, username, async function (err, result, fields){

//       let user = await null

//       if(result){

//         user = await result[0]

        
        

//         if(user && bcrypt.compare(password, user.password)){


//           // const username_ad = await 'ad\\'+ user.username

//           // let check_password = await null
  
//           // if(password === user.password){
//           //   check_password = await true
//           // }else if( await bcrypt.compare(password, user.password)){
//           //   check_password = await true
//           // }else{
//           //   check_password = await false
//           // }

//           // if(check_password){
          
//             // Generate token
//             const newToken = await generateToken({ userId: user.id });

//             let updateData = await {
//               "token"       : newToken,
//               "login_date"  : date,
//               // "password"    : hashedPassword,
//             }

            
       
//             const sql_update = await 'UPDATE register SET ? WHERE username = ?'; 
    
//             db.query(sql_update, [updateData, username], function (err, result2, fields) {
    
//               console.log('=========', result2);

//               return res.json({userdata: user, token: newToken})
      
//             });
    
//           // }else{
//           //   res.status(400).send("error : password error");
//           // } 
  
//         }else{
//           res.status(400).send("error : password error");
//         }

//       }else{
//         res.status(400).send("error : no user in the system");
//       }

//     });


//   } catch (error) {
//     console.log(error)
//   }
// })

// app.post('/api/create/user', async (req, res) => {
//   try {

//     const password = await req.body.password
//     const hashedPassword = await bcrypt.hash(password, 10)

//     let item = await {
//       "name"              : req.body.name,
//       "lastname"          : req.body.lastname,
//       "username"          : req.body.username,
//       "password"          : hashedPassword,
//       "email"             : req.body.email,
//       "check_policy"      : req.body.check_policy,
//       "roles"             : "user",
//       "create_date"       : date,
//       "modified_date"     : date
//   }

//     let sql = await "INSERT INTO register SET ?"

//     db.query(sql,item, async function (error,results,fields){

//         if (error) return res.status(500).json({
//             "status": 500,
//             "message": "Internal Server Error" // error.sqlMessage
//         })
//         item = await [{'id' : results.insertId, ...item}]

//         let updateData = await {
//           "create_by"   : results.insertId,
//           "modified_by" : results.insertId,
//         }

//         const sql_update = await 'UPDATE register SET ? WHERE id = ?'

//         db.query(sql_update, [updateData, results.insertId], function (err, results2, fields){

//             const result = {
//               "status": 200,
//               "data": item.id
//             }

//             return res.json(result)
//         })
        
//     })
    
//   } catch (error) {
    
//   }
// })



app.listen(3000, () =>{
    console.log('Server is listening on port 3000...')
});

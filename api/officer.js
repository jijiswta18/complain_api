const express       = require('express')
const cors          = require('cors')
const moment        = require('moment');
const router        = express.Router()
const db            = require('../config/db') // เรียกใช้งานเชื่อมกับ MySQL
const bcrypt        = require('bcrypt');
const jwt           = require('jsonwebtoken');
const ldap          = require('ldapjs');

router.use(cors({
    //"Access-Control-Allow-Origin": "https://forqueen.cgd.go.th",
origin: '*'

}));

// Create LDAP client connection 
const adConfiguration = {
    url: "ldap://" + process.env.ad_URL,
    reconnect: true,
  }
  const client = ldap.createClient(adConfiguration)
  client.on('error', () => {
    // this will be your ECONNRESET message
  })

moment.locale('th');
let date = moment().format('YYYY-MM-DD HH:mm:ss');

function generateToken(payload) {
  const token = jwt.sign(
      { username : payload.userId },
      process.env.JWT_KEY,
      { expiresIn: "1h" }
  )
  return token;
}


router.route('/backoffice/login')
.post(async (req, res, next) => {

    try {
        const username = await req.body.username
        const password = await req.body.password

        const hashedPassword = await bcrypt.hash(password, 10)

        const sql = await 'SELECT * FROM admin WHERE username = ?';


        db.query(sql, username, async function (err, result, fields){

            let user = await null

            if(result){

                user = await result[0]

            }else{
                res.status(400).send("error : no user in the system");
            }

            if(user){

                const username_ad = await 'ad\\'+ user.username

                client.bind(username_ad, password, async err =>  {

                    let password = await false

                    if(err){
                        res.status(400).send("error : password error");
                    }else{

                        const newToken = await generateToken({ userId: user.id });

                        let updateData = await {
                            "token"     : newToken,
                            "password"  : hashedPassword,
                        }

                        const sql = 'UPDATE officer SET ? WHERE username = ?'; 
                
                        db.query(sql, [updateData, username], function (err, result2, fields) {
            
                            return res.json({userdata: user, token:newToken})
                            
                        });


                    }

                })

            }

        });

    } catch (error) {
        console.log(error)
    }

})

router.route('/backoffice/get/listUser')
.get( (req, res, next) => { 

    // แสดงข้อมูลทั้งหมด
    const sql = 'SELECT id, username, name, lastname, position, divisions, roles, status, state, create_by, create_date, modified_by, modified_date FROM admin ';
    
    db.query(sql, async function (err, results, fields) {

        console.log(err);

        if (err) return res.status(500).json({
            "status": 500,
            "message": "Internal Server Error" // error.sqlMessage
        })

        const result = {
            "status": 200,
            "data"  : results, 
        }

        return res.json(result)

    })
})



router.route('/backoffice/get/userDetail/:id')
.get( (req, res, next) => { 

    // แสดงข้อมูลทั้งหมด
    const sql = "SELECT id, username, name, lastname, position, divisions, roles, status, state, create_by, create_date, modified_by, modified_date FROM admin WHERE id = " + `'${req.params.id}'`
    
    db.query(sql, async function (err, results, fields) {

        console.log(err);

        if (err) return res.status(500).json({
            "status": 500,
            "message": "Internal Server Error" // error.sqlMessage
        })

        const result = {
            "status": 200,
            "data"  : results, 
        }

        return res.json(result)

    })
})

router.route('/backoffice/create/user')
.post(async (req, res, next) => {

    try {

        let user = {
            "username"      : req.body.username,
            "name"          : req.body.name,
            "lastname"      : req.body.lastname,
            "position"      : req.body.position,
            "divisions"     : req.body.divisions,
            "roles"         : req.body.roles,
            "status"        : req.body.status,
            "state"         : 1,
            "create_by"     : req.body.userId,
            "create_date"   : date,
            "modified_by"   : req.body.userId,
            "modified_date" : date
        }

        const token = jwt.sign(
            { username      : user.username },
            process.env.JWT_KEY,
            {
                expiresIn: "2h"
            }
        );

        user.token = token;

        let sql = "INSERT INTO admin SET ?"
        db.query(sql,user,(error,results,fields)=>{

            if (error) return res.status(500).json({
                "status": 500,
                "message": "Internal Server Error" // error.sqlMessage
            })
            user = [{'id':results.insertId, ...user}]
            const result = {
                "status": 200,
                "data": user.id
            }

            return res.json(result)
        })
    } catch (err) {

        console.log(err);
        
    }
 
})

router.route('/backoffice/edit/user')
.post (async (req,res, next) => { 

    try {

        let user = {
            "name"          : req.body.name,
            "lastname"      : req.body.lastname,
            "position"      : req.body.position,
            "divisions"     : req.body.divisions,
            "roles"         : req.body.roles,
            "status"        : req.body.status,
            "state"         : req.body.state,
            "modified_by"   : req.body.userId,
            "modified_date" : date
        }
    
        let sql = "UPDATE admin SET ? WHERE id = ?"
        db.query(sql, [user, req.body.userId], (error,results,fields)=>{
    
            
            if (error) return res.status(500).json({
                "status": 500,
                "message": "Internal Server Error" // error.sqlMessage
            })
    
            const result = {
                "status": 200,
                "data": results
            }
         
            return res.json(result)
        })
        
    } catch (error) {
        console.log(error);
    }

});


module.exports = router
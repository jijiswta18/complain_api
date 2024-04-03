const express       = require('express');
const moment        = require('moment');
const auth          = require('../middleware/auth');
const router        = express.Router();
const db            = require('../config/db'); // เรียกใช้งานเชื่อมกับ MySQL
const bcrypt        = require('bcrypt');
const jwt           = require('jsonwebtoken');
const ldap          = require('ldapjs');
const bodyParser    = require('body-parser');
const nodemailer    = require("nodemailer");
const fs            = require('fs');
const CryptoJS      = require("crypto-js");

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: false }));

moment.locale('th');
let date = moment().format('YYYY-MM-DD HH:mm:ss');


/////////////////////// function //////////////////////////////////

// Create LDAP client connection 
const adConfiguration = {
    url: "ldap://" + process.env.ad_URL,
    reconnect: true,
  }
  const client = ldap.createClient(adConfiguration)
  client.on('error', () => {
    // this will be your ECONNRESET message
});


async function generateToken(id) {

    const payload = await {
        jti: 'unique-nonce-value', // Add a unique nonce value to the jti claim
        "username": id.userId,
        "role": "admin",
        "expiresIn": "1h"    
    }

    const privateKey = await fs.readFileSync('jwtRS256.key');
    const token = await jwt.sign(payload, privateKey,{ algorithm: 'RS256'});

    return token;

}


function hashFileName(fileName) {

    const hashedFileName = CryptoJS.SHA256(fileName).toString(CryptoJS.enc.Hex);

    const eightDigitNumber = parseInt(hashedFileName.substr(0, 8), 16);

    return eightDigitNumber;
}


///////////////////////// GET ///////////////////////////////////

// GET รายการรับเรื่องร้องเรียนทุจริต //
router.route('/backoffice/get/listComplain')
.get(auth(), async (req, res, next) => {
    try {
        const sql = await "SELECT * FROM employee_complain WHERE status_call = 0 ORDER BY id DESC"
        db.query(sql, async function(err, result, fields){ 
            if (err) res.status(500).json({
                "status": 500,
                "message": "Internal Server Error" // error.sqlMessage
            })
            res.status(200).json({
                data: result,
                message: "success"
            }); 
        })
    } catch (error) {
        console.log('getlistComplain',error);     
    }
});

// GET รายการที่ต้องดำเนินการ //
router.route('/backoffice/get/listFollow')
.get(auth(), async (req, res, next) => {
    try {

        let id = req.query.id

        let roles = req.query.roles

        let sql = ''

        if(roles == 'general'){
            sql = await "SELECT a.*, b.name, b.lastname FROM employee_complain a LEFT JOIN admin b on a.admin_id = b.id WHERE a.admin_id = " + `'${id}' AND a.status_call != 0 ORDER BY id DESC`
        } else {
             sql = await "SELECT a.*, b.name, b.lastname FROM employee_complain a LEFT JOIN admin b on a.admin_id = b.id WHERE a.status_call != 0 ORDER BY a.id DESC"
        }


        db.query(sql, async function(err, result, fields){

            console.log(err);

          
            if (err) res.status(500).json({
                "status": 500,
                "message": "Internal Server Error" // error.sqlMessage
            })
            res.status(200).json({
                data: result,
                message: "success"
            }); 
        })
    } catch (error) {
        console.log('getListFollow',error);     
    }
});

// GET รายละเอียดขั้นตอนที่ต้องดำเนินการ //
router.route('/backoffice/get/complainStep/:id')
.get(auth(), async (req, res, next) => {
    try {
        const sql = "SELECT a.*, b.id as corrupt_id, b.reference_code, b.date as corrupt_date,  b.detail as corrupt_detail  FROM employee_complain_step a LEFT JOIN employee_complain_corrupt b on a.id = b.complain_step_id  WHERE a.complain_id = " + `'${req.params.id}'` + "ORDER BY a.id"
        db.query(sql, async function(err, results, fields){

            console.log(err);
            if (err) res.status(500).json({
                "status": 500,
                "message": "Internal Server Error" // error.sqlMessage
            })
            res.status(200).json({
                data: results,
                message: "success"
            }); 
        })
    } catch (error) {
        console.log('getComplainStepId',error);     
    }
});

// GET รายการข้อมูลบุคลากร //
router.route('/backoffice/get/listRegister')
.get(auth(), async (req, res, next) => { 

    try {

        const sql = 'SELECT id, email, name, lastname, phone, create_date FROM employee_register ORDER BY id DESC';

        db.query(sql, async function(err, results, fields){
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

    } catch (error) {
      console.log('getListRegister',error);  
    }
});

// GET รายละเอียดข้อมูลบุคลากร //
router.route('/backoffice/get/registerDetail/:id')
.get(auth(), async (req, res, next) => { 
    try {
        const sql = "SELECT id, email, name, lastname, age, phone, phone_other, address, province_id, province_name, district_id, district_name, subdistrict_id, subdistrict_name, postcode  FROM employee_register WHERE id = " + `'${req.params.id} ' ORDER BY id DESC `
        db.query(sql, async function(err, results, fields){
            if (err) return await res.status(500).json({
                "status": 500,
                "message": "Internal Server Error" // error.sqlMessage
            })
            const result = await {
                "status": 200,
                "data"  : results, 
            }
            return res.json(result)
        })
    } catch (error) {
      console.log('getRegisterDetailId',error);  
    }
});

// router.route('/get/registerDetail/:id')
// .get(auth(), async (req, res, next) => {
//     try {
//         const sql = await "SELECT id, email, name, lastname, gender, age, phone, phone_other, address  FROM employee_register WHERE id = " + `'${req.params.id}'`
//         db.query(sql, async function(err, result, fields){
//             if (err) res.status(500).json({
//                 "status": 500,
//                 "message": "Internal Server Error" // error.sqlMessage
//             })
//             res.status(200).json({
//                 data: result,
//                 message: "success"
//             })
 
//         })

//     } catch (error) {
//         console.log('getRegisterDetailId',error);     
//     }
// });

// GET รายการข้อมูลผู้ร้องเรียน //
router.route('/backoffice/get/listUser')
.get(auth(), (req, res, next) => { 
    // แสดงข้อมูลทั้งหมด
    const sql = 'SELECT id, username, name, lastname, position, divisions, roles, status, state, create_by, create_date, modified_by, modified_date FROM admin ORDER BY id DESC';
    db.query(sql, async function (err, results, fields) {
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
});

// GET รายละเอียดข้อมูลผู้ร้องเรียน //
router.route('/backoffice/get/userDetail/:id')
.get(auth(),(req, res, next) => { 
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
});

// GET รายการข้อความตอบกลับผู้ใช้งาน //
router.route('/backoffice/get/replyMessage')
.get(auth(), async (req, res, next) => {
    try {
        const sql = await "SELECT * FROM reply_message WHERE check_remove = 0 ORDER BY id DESC"
        db.query(sql, async function(err, result, fields){ 
            if (err) res.status(500).json({
                "status": 500,
                "message": "Internal Server Error" // error.sqlMessage
            })
            res.status(200).json({
                data: result,
                message: "success"
            }); 
        })
    } catch (error) {
        console.log('getReplyMessage',error);     
    }

});

// GET รายการช่องทางการติดต่อ //
router.route('/backoffice/get/contactChannels')
.get(auth(), async (req, res, next) => {
    try {
        const sql = await "SELECT * FROM contact_channels WHERE check_remove = 0 ORDER BY id DESC"
        db.query(sql, async function(err, result, fields){ 
            if (err) res.status(500).json({
                "status": 500,
                "message": "Internal Server Error" // error.sqlMessage
            })
            res.status(200).json({
                data: result,
                message: "success"
            }); 
        })
    } catch (error) {
        console.log('getContactChannels',error);     
    }

});

// GET รายการช่องทางการประกาศ //
router.route('/backoffice/get/announce')
.get(auth(), async (req, res, next) => {
    try {
        const sql = await "SELECT * FROM announce_list WHERE check_remove = 0 ORDER BY id DESC"

        db.query(sql, async function(err, result, fields){ 
            if (err) res.status(500).json({
                "status": 500,
                "message": "Internal Server Error" // error.sqlMessage
            })

            res.status(200).json({
                data: result,
                message: "success"
            }); 

        })
    } catch (error) {
        console.log('getAnnounce',error);     
    }

});

// GET รายการช่องทางการสร้างแบนเนอร์ //
router.route('/backoffice/get/banner')
.get(auth(), async (req, res, next) => {
    try {
        const sql = await "SELECT * FROM banners_list WHERE check_remove = 0 ORDER BY id DESC"
        db.query(sql, async function(err, result, fields){ 
            if (err) res.status(500).json({
                "status": 500,
                "message": "Internal Server Error" // error.sqlMessage
            })
            res.status(200).json({
                data: result,
                message: "success"
            }); 
        })
    } catch (error) {
        console.log('getBanner',error);     
    }

});

// GET ไฟล์แนบการร้องเรียน //
router.route('/backoffice/get/ComplainStepFiles/:id')
.get(auth(), async (req, res, next) => {
    try {
        const sql = await "SELECT * FROM employee_operation_files  WHERE complain_step_id = " + `'${req.params.id}'` 
        db.query(sql, async function(err, result, fields){
            
            if (err) res.status(500).json({
                "status": 500,
                "message": "Internal Server Error" // error.sqlMessage
            })
            res.status(200).json({
                data: result,
                message: "success"
            }); 
        })
    } catch (error) {
        console.log('getComplainStepFilesId',error);     
    }
});

// GET ไฟล์แนบการทุจริต //
router.route('/backoffice/get/CorruptFiles/:id')
.get(auth(), async (req, res, next) => {
    try {
        const sql = await "SELECT * FROM employee_corrupt_files  WHERE corrupt_id = " + `'${req.params.id}' AND check_remove = 0`

        db.query(sql, async function(err, result, fields){

            if (err) res.status(500).json({
                "status": 500,
                "message": "Internal Server Error" // error.sqlMessage
            })

            res.status(200).json({
                data: result,
                message: "success"
            }); 
        })

    } catch (error) {
        console.log('getCorruptFilesId',error);     
    }

});


///////////////////////// POST ///////////////////////////////////
router.route('/backoffice/sendFile')
.post(async (req, res, next) => {

    console.log('===========testtttt');
    console.log(req.body);

    var smtp = await {
        host: 'mx.cgd.go.th', //set to your host name or ip
        port: 25, //25, 465, 587 depend on your 
        secure: false, // use SSL\


        
    };

    const fullUrl           = await `${req.protocol}://${req.hostname}:3000`;
    const url               = await fullUrl+"/uploads/complain_step/testfile.pdf";
 
    var smtpTransport = await nodemailer.createTransport(smtp);

    let mailOptions = await {}



    mailOptions = await {
        from: "democom3@cgd.go.th",
        to: req.body.mail,
        subject: 'File Attachment Example',
        html: `<p>ทดสอบการส่งอีเมล</p>` +
        `<b>หมายเหตุ : </b> <span>ข้อความและ e-mail นี้เป็นการสร้างอัตโนมัติจากระบบฯ ไม่ต้องตอบกลับ </span>` ,
        attachments: [
            {
              filename: 'testfile.pdf', // change this to the name of your file
              path: url, // change this to the path of your file
            },
          ],
    };

    await smtpTransport.sendMail(mailOptions, function(error, response){
        smtpTransport.close();
        if(error){
            console.log('sent mail follow',error);
        //error handler
        }else{
        //success handler 
        console.log('send email success');
        }
    });


    return res.json('success')

})

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
              
                const username_ad = await 'ad\\'+ user.username
                client.bind(username_ad, password, async err =>  {
                    let updateData = await {}
                    let  newToken = await generateToken({ userId: user.id });

                    if (err) return res.status(400).json({
                        "status": 400,
                        "message": "password error" // error.sqlMessage
                    })
                    updateData = await {
                        "token"     : newToken,
                        "password_ad"  : hashedPassword,
                    }

                    console.log(updateData);
                    const sql = await 'UPDATE admin SET ? WHERE username = ?'; 
                
                    db.query(sql, [updateData, username], async function (err, result2, fields) {

                    
                        const currentTimestamp = Math.floor(Date.now() / 1000);

                        const expiresIn = 3600; // Expires in 1 hour (adjust as needed)

                        const newExpiration = currentTimestamp + expiresIn;
        
                        const momentObj = moment.unix(newExpiration);
                
                        const formattedDateTime = momentObj.format('YYYY-MM-DD HH:mm:ss');

                        console.log(formattedDateTime);
                        
                        let dataToken = await {
                            "token"         :   newToken,
                            "expire"        :   formattedDateTime,
                            "revoke"        :   0,
                            "user_id"       :   user.id,
                            "roles"         :   'officer'
                        }

                        let sql_token = await 'INSERT INTO token SET ?'

                        db.query(sql_token, dataToken, async function (error,results_token,fields){
            
                            if (error) return res.status(500).json({
                                "status": 500,
                                "message": "Internal Server Error" // error.sqlMessage
                            })
                
                            dataToken = await [{'id' : results_token.insertId,...dataToken}]
                                
                        })

                        return res.json({userdata: user, token:newToken})
                        
                    });

                })

            }else{
                res.status(400).send("error : no user in the system");
            }

        });

    } catch (error) {
        console.log('login',error)
    }
})



// POST สร้าง User //
router.route('/backoffice/create/user')
.post(auth(), async (req, res, next) => {

    try {

        const hashedPassword = await bcrypt.hash(req.body.password, 10)
        let user = {
            "username"      : req.body.username,
            "password_ad"   : hashedPassword,
            "name"          : req.body.name,
            "lastname"      : req.body.lastname,
            "position"      : req.body.position,
            "divisions"     : req.body.divisions,
            "roles"         : req.body.roles,
            "status"        : req.body.status,
            "state"         : 1,
            "create_by"     : req.body.admin_id,
            "create_date"   : date,
            "modified_by"   : req.body.admin_id,
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

        console.log('createUser',err);
        
    }
 
})

// POST แก้ไข User //
router.route('/backoffice/edit/user')
.post (auth(), async (req,res, next) => { 

    try {

        // const hashedPassword = await bcrypt.hash(req.body.password, 10)

        let user = {
            // "password"      : hashedPassword,
            "name"          : req.body.name,
            "lastname"      : req.body.lastname,
            "position"      : req.body.position,
            "divisions"     : req.body.divisions,
            "roles"         : req.body.roles,
            "status"        : req.body.status,
            "state"         : req.body.state,
            "modified_by"   : req.body.admin_id,
            "modified_date" : date
        }

        let sql = "UPDATE admin SET ? WHERE id = ?"
        db.query(sql, [user, req.body.user_id], (error,results,fields)=>{
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
        console.log('editUser',error);
    }

});



// POST ขั้นตอนการรับเรื่อง //
router.route('/backoffice/create/complainStep')
.post (auth(), async (req,res, next) => { 

    try {

        let item = {
            "complain_id"           : req.body.complain_id,
            "admin_id"              : req.body.admin_id,
            "register_id"           : req.body.register_id,
            "detail"                : req.body.detail,
            "date"                  : date,
            "status_call"           : req.body.status_call,
            "cancel_message_id"     : req.body.cancel_message_id,
            "cancel_message_name"   : req.body.cancel_message_name,
            "cancel_contact_id"     : req.body.cancel_contact_id,
            "cancel_contact_name"     : req.body.cancel_contact_name,
            "cancel_contact_url"    : req.body.cancel_contact_url,
            "cancel_message_other"  : req.body.cancel_message_other,
            "check_corrupt"         : req.body.check_corrupt,
            "create_by"             : req.body.create_by,
            "create_date"           : date,
            "modified_by"           : req.body.modified_by,
            "modified_date"         : date
        }
       
        let sql = "INSERT INTO employee_complain_step SET ? "

        db.query(sql,item, async function (error,results,fields){
            console.log(error)
           

            if (error) return res.status(500).json({
                "status": 500,
                "message": "Internal Server Error" // error.sqlMessage
            })
            item = [{'id':results.insertId, ...item}]

            let user = {
               
                "status_call"   : req.body.status_call,
                "admin_id"      : req.body.admin_id,
                "modified_by"   : req.body.modified_by,
                "modified_date" : date
            }
        

            let sql_update = "UPDATE employee_complain SET ? WHERE id = ?"

            db.query(sql_update,[user, req.body.complain_id], async function (error2,results2,fields2){

                if (error2) return res.status(500).json({
                    "status": 500,
                    "message": "Internal Server Error" // error.sqlMessage
                })

                const result = {
                    "status": 200,
                    "complain_step_id": results.insertId,
                    "check" : true
                }

                var smtp = await {
                    host: 'mx.cgd.go.th', //set to your host name or ip
                    port: 25, //25, 465, 587 depend on your 
                    secure: false, // use SSL\

                };
                var smtpTransport = await nodemailer.createTransport(smtp);

                let mailOptions = await {}

                if(req.body.status_call == 2){
                    mailOptions = {
                
                        from: "democom3@cgd.go.th",
                        to: req.body.register_email,
                        
                        subject: 'เเจ้งผลการดำเนินการ ระบบรับเรื่องร้องเรียนทุจริต',
                     
                        html: `<p>เรียน คุณ${req.body.register_name}</p>` +
                        `<p>รายการของท่าน อยู่ในสถานะ "${req.body.status_name}" </p>` +
                        `<p>${req.body.cancel_message_name}</p>` +
                        `<p>กรุณาร้องเรียนผ่านทางช่องทางนี้ค่ะ ${req.body.cancel_contact_url}</p>` +
                        
                        `<p>สามารถตรวจสอบข้อมูลได้ ตาม URL : ${req.protocol}://${req.hostname}/user/login </p>` +

                        `<b>หมายเหตุ : </b> <span>ข้อความและ e-mail นี้เป็นการสร้างอัตโนมัติจากระบบฯ ไม่ต้องตอบกลับ </span>` ,

                     
 
                    };

                }else{
                    mailOptions = {
                
                        from: "democom3@cgd.go.th",
                        to: req.body.register_email,
                        
                        subject: 'เเจ้งผลการดำเนินการ ระบบรับเรื่องร้องเรียนทุจริต',
                        html: `<p>เรียน คุณ${req.body.register_name}</p>` +
                        `<p>รายการของท่าน อยู่ในสถานะ "${req.body.status_name}" </p>` +
                        `<p>สามารถตรวจสอบข้อมูลได้ ตาม URL : ${req.protocol}://${req.hostname}/user/login </p>` +

                        `<b>หมายเหตุ : </b> <span>ข้อความและ e-mail นี้เป็นการสร้างอัตโนมัติจากระบบฯ ไม่ต้องตอบกลับ </span>`
                              
                    };
                }

                await smtpTransport.sendMail(mailOptions, function(error, response){
                    smtpTransport.close();
                    if(error){
                        console.log('sent mail follow',error);
                    //error handler
                    }else{
                    //success handler 
                    console.log('send email success');
                    }
                });

    
                return res.json(result)

            })

          
        })

    } catch (error) {
        console.log('createComplainStep',error);
    }

});

// POST แก้ไขขั้นตอนการรับเรื่อง //
router.route('/backoffice/edit/complainStep')
.post (auth(), async (req,res, next) => { 

    try {
        let items = {
            "admin_id"      : req.body.admin_id,
            "detail"        : req.body.detail,
            "date"          : date,
            "status_call"   : req.body.status_call,
            "check_corrupt" : req.body.check_corrupt,
            "modified_by"   : req.body.admin_id,
            "modified_date" : date
        }
    
        let sql = " UPDATE employee_complain_step SET ? WHERE id = ?"


        db.query(sql,[items, req.body.complain_step_id], async function (error,results,fields){

            if (error) return res.status(500).json({
                "status": 500,
                "message": "Internal Server Error" // error.sqlMessage
            })
      
            let item = {
               
                "status_call"   : req.body.status_call,
                "admin_id"      : req.body.admin_id,
                "modified_by"   : req.body.modified_by,
                "modified_date" : date
            }
        

            let sql_update = "UPDATE employee_complain SET ? WHERE id = ?"

            db.query(sql_update,[item, req.body.complain_id], async function (error2,results2,fields2){

                console.log(error2);

                if (error2) return res.status(500).json({
                    "status": 500,
                    "message": "Internal Server Error" // error.sqlMessage
                })

                const result = {
                    "status": 200,
                    "complain_step_id": results.insertId,
                    "check" : true
                }
    
                return res.json(result)

            })

          
        })
        
    } catch (error) {
        console.log('editComplainStep',error);
    }

});

// POST ขั้นตอนการทุจริต //
router.route('/backoffice/create/complainCorrupt')
.post (auth(), async (req,res, next) => { 

    try {

        let item = await{
            "complain_step_id"  : req.body.complain_step_id,
            "create_by"         : req.body.admin_id,
            "modified_by"       : req.body.admin_id,
            "create_date"       : date,
            "modified_date"     : date
        }
    
        let sql = await "INSERT INTO employee_complain_corrupt SET ? "

        db.query(sql,item, async function (error,results,fields){

           if (error) return res.status(500).json({
                "status": 500,
                "message": "Internal Server Error" // error.sqlMessage
            })

            item = await [{'id':results.insertId, ...item}]

           const result =  await {
                "status": 200,
                "corrupt_id": results.insertId,
            }

            return res.json(result)
        })  
    } catch (error) {
        console.log('createComplainCorrupt',error);
    }

});

// POST แก้ไขขั้นตอนการทุจริต //
router.route('/backoffice/edit/complainCorrupt')
.post (auth(), async (req,res, next) => { 

    try {

        let item = {
            "complain_step_id"  : req.body.complain_step_id,
            "reference_code"    : req.body.reference_code,
            "date"              : req.body.date,
            "detail"            : req.body.detail,
            "modified_by"       : req.body.admin_id,
            "modified_date"     : date
        }
    
        let sql = "UPDATE employee_complain_corrupt SET ? WHERE id = ?"


        db.query(sql,[item, req.body.corrupt_id], async function (error,results,fields){

            console.log(error);


            if (error) return res.status(500).json({
                "status": 500,
                "message": "Internal Server Error" // error.sqlMessage
            })

            const result = {
                "status": 200,
                "corrupt_id" : req.body.corrupt_id
            }

            return res.json(result)
        })  
    } catch (error) {
        console.log('editComplainCorrupt',error);

        
    }

});

// POST ขั้นตอนการแนบไฟล์รับเรื่อง //
router.route('/backoffice/complainStepFiles')
.post(auth(), async (req, res, next) => {
    try {

        let item = await {
            "file_original"     : req.body.file_original,
            "file_name"         : req.body.file_name,
            "file_type"         : req.body.file_type,
            "register_id"       : req.body.register_id,
            "complain_step_id"  : req.body.complain_step_id,
            "create_by"         : req.body.register_id,
            "create_date"       : date,
            "modified_by"       : req.body.register_id,
            "modified_date"     : date
        }

        let sql = await "INSERT INTO employee_operation_files SET ?"

        db.query(sql, item, async function (error,results,fields){

            if (error) return res.status(500).json({
                "status": 500,
                "message": "Internal Server Error" // error.sqlMessage
            })

            item = await [{'id' : results.insertId, ...item}]

            const result = {
                "status": 200,
                "data": results.insertId
              }
  
            return res.json(result)

        })

    } catch (error) {
        console.log('complainStepFiles', error);
    }
  
})

// POST ขั้นตอนการแนบไฟล์ทุจริต //
router.route('/backoffice/create/complainCorruptFiles')
.post(auth(), async (req, res, next) => {
    try {

        const arr_file          = await req.body.file_type.split("/")

        const hashedFileName    = await hashFileName(req.body.file_original);

        const fileName          = await hashedFileName + '.' + arr_file[1] 


        let item = await {
            "corrupt_id"        : req.body.corrupt_id,
            "reference_code"    : req.body.reference_code,
            "file_original"     : req.body.file_original,
            "file_name"         : fileName,
            "file_type"         : req.body.file_type,
            "check_remove"      : req.body.check_remove,
            // "check_remove_file" : req.body.check_remove_file,
            "create_by"         : req.body.admin_id,
            "create_date"       : date,
            "modified_by"       : req.body.admin_id,
            "modified_date"     : date
        }

        let sql = await "INSERT INTO employee_corrupt_files SET ?"
        db.query(sql, item, async function (error,results,fields){
            if (error) return res.status(500).json({
                "status": 500,
                "message": "Internal Server Error" // error.sqlMessage
            })
            item = await [{'id' : results.insertId, ...item}]
            const result = {
                "status": 200,
                "corrupt_file_id": results.insertId,
                "file_name" : fileName
              }
            return res.json(result)
        })
    } catch (error) {
        console.log('complainCorruptFiles', error);
    }  
})

// POST ขั้นตอนการแก้ไขแนบไฟล์ทุจริต //
router.route('/backoffice/edit/complainCorruptFiles')
.post(auth(), async (req, res, next) => {
    try {

        let fileName = await ''

        if(req.body.file_name === null){
            console.log('true');
            const arr_file          = await req.body.file_type.split("/")

            const hashedFileName    = await hashFileName(req.body.file_original);
    
            fileName                = await hashedFileName + '.' + arr_file[1] 
        }else{
            console.log('false');
            fileName                = await req.body.file_name
        }

      

        let item = await {
            "reference_code"    : req.body.reference_code,
            "file_original"     : req.body.file_original,
            "file_name"         : fileName,
            "file_type"         : req.body.file_type,
            "check_remove"      : req.body.check_remove,
            // "check_remove_file" : req.body.check_remove_file,
            "modified_by"       : req.body.admin_id,
            "modified_date"     : date
        }

        console.log(item);
        const sql_update = await 'UPDATE employee_corrupt_files SET ? WHERE id = ?'; 
        db.query(sql_update, [item, req.body.id], async function (error,results,fields){
            if (error) return res.status(500).json({
                "status": 500,
                "message": "Internal Server Error" // error.sqlMessage
            })

            const result = {
                "status": 200,
                "corrupt_file_id" : req.body.id,
                "file_name" : fileName
            }

            return res.json(result)
           
        })
    } catch (error) {
        console.log('complainCorruptFiles', error);
    }  
})



// POST สร้างข้อความตอบกลับผู้ใช้งาน //
router.route('/backoffice/create/replyMessage')
.post(auth(), async (req, res, next) => {
    try {

        let item = await req.body
       
        let sql = await "INSERT INTO reply_message SET ?"
        db.query(sql, item, async function (error,results,fields){

            if (error) return res.status(500).json({
                "status": 500,
                "message": "Internal Server Error" // error.sqlMessage
            })
            item = await [{'id' : results.insertId, ...item}]
            const result = {
                "status": 200,

                // "corrupt_file_id": results.insertId
              }
            return res.json(result)
        })
    } catch (error) {
        console.log('createReplyMessage', error);
    }  
})

// POST แก้ไขข้อความตอบกลับผู้ใช้งาน //
router.route('/backoffice/edit/replyMessage')
.post (auth(), async (req,res, next) => { 

    try {

        let item = {
            "message_detail"            : req.body.message_detail,
            "message_detail_other"      : req.body.message_detail_other,
            "modified_by"               : req.body.modified_by,
            "modified_date"             : date
        }
    
        let sql = "UPDATE reply_message SET ? WHERE id = ?"


        db.query(sql,[item, req.body.id], async function (error,results,fields){

            if (error) return res.status(500).json({
                "status": 500,
                "message": "Internal Server Error" // error.sqlMessage
            })

            const result = {
                "status": 200,
            }

            return res.json(result)
        })  
    } catch (error) {
        console.log('editReplyMessage',error);

        
    }

});

// POST ลบรายการข้อความตอบกลับผู้ใช้งาน //
router.route('/backoffice/update/deleteReplyMessage')
.post(auth(), async (req,res, next)=> { 
    try {

        let item = {
            "check_remove"  : req.body.check_remove,
            "modified_by"   : req.body.admin_id,
            "modified_date" : date
        }
        let sql = "UPDATE reply_message SET ? WHERE id = ?"
        
        db.query(sql,[item, req.body.id], (error,results,fields)=>{

            console.log(error);

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
        console.log('updateDeleteReplyMessage',error);
    }
});

// POST อัพเดตสถานะการใช้งานข้อความตอบกลับผู้ใช้งาน //
router.route('/backoffice/update/replyMessageStatus')
.post(auth(), async (req,res, next)=> { 
    try {

        console.log(req.body);

        let item = {
            "status"        : req.body.status,
            "modified_by"   : req.body.admin_id,
            "modified_date" : date
        }
        let sql = "UPDATE reply_message SET ? WHERE id = ?"
        
        db.query(sql,[item, req.body.id], (error,results,fields)=>{

            console.log(error);

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
        console.log('updateReplyMessageStatus',error);
    }
});



// POST สร้างช่องทางการติดต่อ //
router.route('/backoffice/create/contactChannels')
.post(async (req, res, next) => {
    try {

        let item = await req.body
       
        let sql = await "INSERT INTO contact_channels SET ?"
        db.query(sql, item, async function (error,results,fields){

            if (error) return res.status(500).json({
                "status": 500,
                "message": "Internal Server Error" // error.sqlMessage
            })
            item = await [{'id' : results.insertId, ...item}]
            const result = {
                "status": 200,
                // "corrupt_file_id": results.insertId
              }
            return res.json(result)
        })
    } catch (error) {
        console.log('createContactChannels', error);
    }  
})

// POST แก้ไขช่องทางการติดต่อ //
router.route('/backoffice/edit/contactChannels')
.post (auth(), async (req,res, next) => { 

    try {

        let item = {
            "contact_name"    : req.body.contact_name,
            "contact_link"    : req.body.contact_link,
            "modified_by"     : req.body.modified_by,
            "modified_date"   : date
        }
    
        let sql = "UPDATE contact_channels SET ? WHERE id = ?"


        db.query(sql,[item, req.body.id], async function (error,results,fields){

            if (error) return res.status(500).json({
                "status": 500,
                "message": "Internal Server Error" // error.sqlMessage
            })

            const result = {
                "status": 200,
            }

            return res.json(result)
        })  
    } catch (error) {
        console.log('editContactChannels',error);

        
    }

});

// POST ลบรายการช่องทางการติดต่อ //
router.route('/backoffice/update/deleteContactChannels')
.post(auth(), async (req,res, next)=> { 
    try {

        let item = {
            "check_remove"  : req.body.check_remove,
            "modified_by"   : req.body.admin_id,
            "modified_date" : date
        }
        let sql = "UPDATE contact_channels SET ? WHERE id = ?"
        
        db.query(sql,[item, req.body.id], (error,results,fields)=>{

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
        console.log('updateDeleteContactChannels',error);
    }
});

// POST อัพเดตสถานะการใช้งานช่องทางการติดต่อ //
router.route('/backoffice/update/contactChannelsStatus')
.post(auth(), async (req,res, next)=> { 
    try {
        let item = {
            "status"        : req.body.status,
            "modified_by"   : req.body.admin_id,
            "modified_date" : date
        }
        let sql = "UPDATE contact_channels SET ? WHERE id = ?"
        
        db.query(sql,[item, req.body.id], (error,results,fields)=>{

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
        console.log('updateContactChannelsStatus',error);
    }
});



// POST สร้างช่องทางการประกาศ //
router.route('/backoffice/create/announce')
.post(auth(), async (req, res, next) => {
    try {
        
        const arr_file          = await req.body.file_type.split("/")

        const hashedFileName    = await hashFileName(req.body.file_original);

        const fileName                = await hashedFileName + '.' + arr_file[1] 


        let item = await {
            "announce_name"           : req.body.announce_name,
            "announce_title"          : req.body.announce_title,
            "announce_content"        : req.body.announce_content,
            "announce_type"           : req.body.announce_type,
            "number_preview"          : req.body.number_preview,
            "file_original"           : req.body.file_original,
            "file_name"               : fileName,
            "file_type"               : req.body.file_type,
            "start_date"              : req.body.start_date,
            "end_date"                : req.body.end_date,
            "status"                  : req.body.status,
            "check_remove"            : req.body.check_remove,
            "create_by"               : req.body.create_by,
            "create_date"             : date,
            "modified_by"             : req.body.create_by,
            "modified_date"           : date
        }

    
        let sql = await "INSERT INTO announce_list SET ?"

        db.query(sql, item, async function (error,results,fields){

            console.log(error);

            if (error) return res.status(500).json({
                "status": 500,
                "message": "Internal Server Error" // error.sqlMessage
            })
            req.body = await [{'id' : results.insertId, ...req.body}]

            // return res.json({"announce_id": result.announce_id, "status": 200})

            const result = {
                "status": 200,
                "announce_id": results.insertId,
                "file_name" : fileName
            }

            return res.json(result)

            // return res.json({"announce_id": result.announce_id, "status": 200})

            // if(result){

            //     const arr_file = await req.body.file_type.split("/")
    
            //     let file_name = await ''
                
            //     if(req.body.file_type === 'image/jpeg' || req.body.v === 'image/jpg' || req.body.file_type === 'image/png'){
    
            //     file_name = await 'imgAnnounce' +  result.announce_id + '.' + arr_file[1] 
    
            //     }else if(req.body.file_type === 'application/pdf'){
    
            //     file_name = await 'pdfAnnounce' +  result.announce_id + '.' + arr_file[1] 

            //     }

            //     let updateData = await {
            //         "file_original" : req.body.file_name,
            //         "file_name"     : file_name,
            //         "file_type"     : req.body.file_type,
            //         "modified_by"   : req.body.roles_id,
            //         "modified_date" : date,
            //     }
    
            //     let sql_update = await "UPDATE announce_list SET ? WHERE id = ?"
    
            //     db.query(sql_update, [updateData, result.announce_id], async function (err, result2, fields) {
    
            //         if (error) return res.status(500).json({
            //             "status": 500,
            //             "message": "Internal Server Error" // error.sqlMessage
            //         })
    
            //         return res.json({"announce_id": result.announce_id, "status": 200})
                    
            //     });

            // }

        })
    } catch (error) {
        console.log('createAnnounce', error);
    }  
})

// POST แก้ไขช่องทางการประกาศ //
router.route('/backoffice/edit/announce')
.post(auth(), async (req,res, next)=> { 
    try {

        // let fileName = null

            const arr_file          = await req.body.file_type.split("/")

        // if(req.body.file_name === null || req.body.file_name === undefined){

            const hashedFileName    = await hashFileName(req.body.file_original);

            const fileName                = await hashedFileName + '.' + arr_file[1] 

            console.log(fileName);

        // }else{

        //     fileName                = await req.body.file_name
        // }

        // console.log(fileName);
        // console.log(fileName);
        // console.log(req.body.file_type);
        
        // const hashedFileName    = await hashFileName(req.body.file_name);

        // const arr_file          = await req.body.file_type.split("/")
    
        // const fileName          = await hashedFileName + '.' + + arr_file[1] 

        let item = await {
            "announce_name"             : req.body.announce_name,
            "announce_title"            : req.body.announce_title,
            "announce_content"          : req.body.announce_content,
            "announce_type"             : req.body.announce_type,
            "file_original"             : req.body.file_original,
            "file_name"                 : fileName,
            "file_type"                 : req.body.file_type,
            "start_date"                : req.body.start_date,
            "end_date"                  : req.body.end_date,
            "status"                    : req.body.status,
            "check_remove"              : req.body.check_remove,
            "modified_by"               : req.body.roles_id,
            "modified_date"             : date
            
        }

        console.log(fileName);
      
        let sql = "UPDATE announce_list SET ? WHERE id = ?"
        
        db.query(sql,[item, req.body.announce_id], (error,results,fields)=>{

            console.log(error);

            if (error) return res.status(500).json({
                "status": 500,
                "message": "Internal Server Error" // error.sqlMessage
            })

            const result = {
                "status": 200,
                "announce_id": req.body.announce_id,
                "file_name" : fileName
            }
         
            return res.json(result)
        })

    } catch (error) {
        console.log('editAnnounce',error);
    }
});

// POST ลบรายการช่องทางการประกาศ //
router.route('/backoffice/update/deleteAnnounce')
.post(auth(), async (req,res, next)=> { 
    try {

        let item = {
            "check_remove"  : req.body.check_remove,
            "modified_by"   : req.body.admin_id,
            "modified_date" : date
        }
        let sql = "UPDATE announce_list SET ? WHERE id = ?"
        
        db.query(sql,[item, req.body.id], (error,results,fields)=>{

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
        console.log('updatedeleteAnnounce',error);
    }
});

// POST อัพเดตสถานะการใช้งานช่องทางการประกาศ //
router.route('/backoffice/update/announcesStatus')
.post(auth(), async (req,res, next)=> { 
    try {
        let item = {
            "status"        : req.body.status,
            "modified_by"   : req.body.admin_id,
            "modified_date" : date
        }
        let sql = "UPDATE announce_list SET ? WHERE id = ?"
        
        db.query(sql,[item, req.body.id], (error,results,fields)=>{

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
        console.log('updateannouncesStatus',error);
    }
});

// POST ลบไฟล์แนบช่องทางการประกาศ //
router.route('/backoffice/update/deleteAnnounceFile')
.post(auth(), async (req,res, next)=> { 
    try {

        let item = {
            // "check_remove"  : req.body.check_remove,
            "file_original" : req.body.file_original,
            "file_name"     : req.body.file_name,
            "file_type"     : req.body.file_type,
            "modified_by"   : req.body.admin_id,
            "modified_date" : date
        }
        let sql = "UPDATE announce_list SET ? WHERE id = ?"
        // let sql = "UPDATE announce_list_files SET ? WHERE id = ?"
        
        db.query(sql,[item, req.body.id], (error,results,fields)=>{

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
        console.log('updatedeleteAnnounce',error);
    }
});



// POST สร้างรายการแบนเนอร์ //
router.route('/backoffice/create/banner')
.post(auth(), async (req, res, next) => {
    try {
        
        const arr_file          = await req.body.file_type.split("/")

        const hashedFileName    = await hashFileName(req.body.file_original);

        const fileName          = await hashedFileName + '.' + arr_file[1] 


        let item = await {
            "banner_name"               : req.body.banner_name,
            "file_original"             : req.body.file_original,
            "file_name"                 : fileName,
            "file_type"                 : req.body.file_type,
            "start_date"                : req.body.start_date,
            "end_date"                  : req.body.end_date,
            "status"                    : req.body.status,
            "check_remove"              : req.body.check_remove,
            "create_by"                 : req.body.create_by,
            "create_date"               : date,
            "modified_by"               : req.body.create_by,
            "modified_date"             : date
        }

    
        let sql = await "INSERT INTO banners_list SET ?"

        db.query(sql, item, async function (error,results,fields){

            console.log(error);

            if (error) return res.status(500).json({
                "status": 500,
                "message": "Internal Server Error" // error.sqlMessage
            })
            req.body = await [{'id' : results.insertId, ...req.body}]

            const result = {
                "status": 200,
                "banner_id": results.insertId,
                "file_name" : fileName
            }

            return res.json(result)
        })
    } catch (error) {
        console.log('createBanner', error);
    }  
})

// POST แก้ไขรายการแบนเนอร์ //
router.route('/backoffice/edit/banner')
.post(auth(), async (req,res, next)=> { 
    try {

        const arr_file          = await req.body.file_type.split("/")

        const hashedFileName    = await hashFileName(req.body.file_original);

        const fileName                = await hashedFileName + '.' + arr_file[1] 

        let item = await {
            "banner_name"               : req.body.banner_name,
            "file_original"             : req.body.file_original,
            "file_name"                 : fileName,
            "file_type"                 : req.body.file_type,
            "start_date"                : req.body.start_date,
            "end_date"                  : req.body.end_date,
            // "status"                    : req.body.status,
            // "check_remove"              : req.body.check_remove,
            "modified_by"               : req.body.roles_id,
            "modified_date"             : date
            
        }

        let sql = "UPDATE banners_list SET ? WHERE id = ?"
        
        db.query(sql,[item, req.body.banner_id], (error,results,fields)=>{

            console.log(sql);

            console.log(error);

            if (error) return res.status(500).json({
                "status": 500,
                "message": "Internal Server Error" // error.sqlMessage
            })

            const result = {
                "status": 200,
                "banner_id": req.body.banner_id,
                "file_name" : fileName
            }
         
            return res.json(result)
        })

    } catch (error) {
        console.log('editAnnounce',error);
    }
});

// POST ลบรายการแบนเนอร์ //
router.route('/backoffice/update/deleteBanner')
.post(auth(), async (req,res, next)=> { 
    try {

        let item = {
            "check_remove"  : req.body.check_remove,
            "modified_by"   : req.body.admin_id,
            "modified_date" : date
        }
        let sql = "UPDATE banners_list SET ? WHERE id = ?"
        
        db.query(sql,[item, req.body.id], (error,results,fields)=>{

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
        console.log('updatedeleteBanner',error);
    }
});

// POST ลบไฟล์แนบแบนเนอร์ //
router.route('/backoffice/update/deleteBannerFile')
.post(auth(), async (req,res, next)=> { 
    try {

        let item = {

            "file_original" : req.body.file_original,
            "file_name"     : req.body.file_name,
            "file_type"     : req.body.file_type,
            "modified_by"   : req.body.admin_id,
            "modified_date" : date
        }
        let sql = "UPDATE banners_list SET ? WHERE id = ?"
        // let sql = "UPDATE announce_list_files SET ? WHERE id = ?"
        
        db.query(sql,[item, req.body.id], (error,results,fields)=>{

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
        console.log('updatedeleteAnnounce',error);
    }
});



module.exports = router
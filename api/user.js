const express       = require('express');
const cors          = require('cors');
const moment        = require('moment');
const multer        = require('multer');
const auth          = require('../middleware/auth')
const router        = express.Router();
const db            = require('../config/db'); // เรียกใช้งานเชื่อมกับ MySQL
const bcrypt        = require('bcrypt');
const fetch         = require('node-fetch');

const jwt           = require('jsonwebtoken');
const nodemailer    = require("nodemailer");
const bodyParser    = require('body-parser');

const CryptoJS      = require("crypto-js");
const Buffer        = require('buffer/').Buffer
const fs            = require('fs');

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: false }));

// router.use(express.static('public'));

router.use(cors({
    //"Access-Control-Allow-Origin": "https://forqueen.cgd.go.th",
origin: '*'

}));


const message = "Hello, World!";
const secretKey = "secret key";

// Encrypt the message using AES
const ciphertext = CryptoJS.AES.encrypt(message, secretKey).toString();

console.log("Ciphertext:", ciphertext); // Output: "Ciphertext: U2FsdGVkX18NU9H6UJ1rhE0+/OyS6oL/vz/W3IfU6e4="

// Decrypt the message using AES
const bytes = CryptoJS.AES.decrypt(ciphertext, secretKey);
const decryptedMessage = bytes.toString(CryptoJS.enc.Utf8);

console.log("Decrypted message:", decryptedMessage); // Output: "Decrypted message: Hello, World!"

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


function generateStrongPassword(length) {
    const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
    const numberChars = '0123456789';
    const specialChars = '!@#$%^&*()_+{}|:<>?-=[];,./';
  
    // create an array of all possible characters
    const allChars = uppercaseChars + lowercaseChars + numberChars + specialChars;
  
    // create an array to hold the password characters
    let password = [];
  
    // loop through each character in the password
    for (let i = 0; i < length; i++) {
      // generate a random index to select a character from the allChars array
      const randomIndex = Math.floor(Math.random() * allChars.length);
      const char = allChars[randomIndex];
  
      // add the character to the password array
      password.push(char);
    }
  
    // join the password array into a string and return it
    return password.join('');
}

// uoload image
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/user');
    },

    filename: function (req, file, cb) {
        let newFileName         =   req.body.image_name
       cb(null, newFileName);
    },
    limits: {
        fileSize: 100000
    },
    onFileSizeLimit: function (file) {
        console.log('Failed: ' + file.originalname + ' is limited')
        fs.unlink(file.path)
    }
});

var upload = multer({ storage: storage });


router.route('/user/get/complainDetail/:id')
.get(auth, async (req, res, next) => {
    try {
        const sql = await "SELECT * FROM employee_complain WHERE id = " + `'${req.params.id}'`
        db.query(sql, async function(err, result, fields){
            
            if(result){
                let sql_files = await "SELECT * FROM employee_files WHERE complain_id = " + `'${req.params.id}'`

                db.query(sql_files, async function(err, result2, fields){

                    if (err) res.status(500).json({
                        "status": 500,
                        "message": "Internal Server Error" // error.sqlMessage
                    })
        

                    res.status(200).json({
                        data: result,
                        data_files : result2,
                        message: "success"
                    }); 
                })
            }

            if (err) res.status(500).json({
                "status": 500,
                "message": "Internal Server Error" // error.sqlMessage
            })

        })

    } catch (error) {
        console.log(error);     
    }
})


router.route('/user/get/listFollow/:id')
.get(auth, async (req, res, next) => {

    try {

        const sql = await "SELECT * FROM employee_complain WHERE register_id = " + `'${req.params.id}'`

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
        console.log(error);     
    }

})



router.route('/user/get/complainStep/:id')
.get(auth, async (req, res, next) => {

    try {

        const sql = await "SELECT * FROM employee_complain_step  WHERE complain_id = " + `'${req.params.id}' AND status_call IN (0,1,2)` 
        // const sql = await "SELECT employee_complain_step.*, admin.name, admin.lastname  FROM employee_complain_step JOIN admin ON employee_complain_step.admin_id = admin.id WHERE employee_complain_step.complain_id = " + `'${req.params.id}'`

        db.query(sql, async function(err, result, fields){

            console.log(sql);
            
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
        console.log(error);     
    }

})


router.route('/user/login')
.post(async (req, res, next) => {
    try {
        const email = await req.body.email
        const password = await req.body.password

    
        const sql = await 'SELECT * FROM employee_register WHERE email = ?';
    
    
        db.query(sql, email, async function (err, result, fields){

            let user = await null
    
            if(result){
    
                user = await result[0]
                console.log('=======', user);
               
                if(user && (await bcrypt.compare(password, user.password))){

                  

                    console.log(await bcrypt.compare(password, user.password));
        
                    // Generate token
                    const newToken = await generateToken({ userId: user.id });
        
                    let updateData = await {
                    "token"       : newToken,
                    "login_date"  : date,
                    }

                    let data = await {
                        "id"                : user.id,
                        "token"             : user.token,
                        "email"             : user.email,
                        "name"              : user.name,
                        "lastname"          : user.lastname,
                        "gender"            : user.gender,
                        "age"               : user.age,
                        "phone"             : user.phone,
                        "phone_other"       : user.phone_other,
                        "address"           : user.address,
                        "province_id"       : user.province_id,
                        "district_id"       : user.district_id,
                        "subdistrict_id"    : user.subdistrict_id,
                        "postcode"          : user.postcode,
                        "roles"             : user.roles,
                    }
            

            
                    const sql_update = await 'UPDATE employee_register SET ? WHERE id = ?'; 
            
                    db.query(sql_update, [updateData, user.id], function (err, result2, fields) {


                    return res.json({userdata: data, token: newToken})
            
                    });
            
                }else{
                    res.status(400).send("error : password error");
                }
    
            }else{
                res.status(400).send("error : no user in the system");
            }
    
        });
    
    } catch (error) {
        console.log(error)
    }
})

router.route('/user/forgot-password')
.post(async (req, res, next) => {

    const { email } = req.body;

    try {

        const sql = await "SELECT id, email FROM employee_register  WHERE email = " + `'${email}'`

        db.query(sql, async function(err, result, fields){

            console.log(err);

            let user = await null

            if(result){

                user = await result[0]

                const forgot_token = await generateToken({ userId: user.id });

                // const hashedToken = await bcrypt.hash(forgot_token, 10)

                let update_token = await {"forgot_token"  : forgot_token}
            
                    const sql_update = await 'UPDATE employee_register SET ? WHERE id = ?'; 
            
                    db.query(sql_update, [update_token, user.id], function (err2, result2, fields) {

                        if (err2) res.status(500).json({
                            "status": 500,
                            "message": "Internal Server Error" // error.sqlMessage
                        })
            
                    });

                    var smtp = {
                        host: 'mx.cgd.go.th', //set to your host name or ip
                        port: 25, //25, 465, 587 depend on your 
                        secure: false, // use SSL\
                        
                        // auth: {
                        //   user: 'democom3@cgd.go.th', //user account
                        //   pass: '' //user password
                        // }
                      };
                      var smtpTransport = nodemailer.createTransport(smtp);
                      
                    // Send the password reset email
                    const mailOptions = await {
                        from: "democom3@cgd.go.th",
                        to: email,
                        subject: "Password Reset Request",
                        text: `Please follow this link to reset your password: http://localhost:8080/user/reset-password?token=${forgot_token}`
                    };


                    smtpTransport.sendMail(mailOptions, function(error, response){
                        smtpTransport.close();
                        if(error){
                            console.log(error);
                           //error handler
                        }else{
                           //success handler 
                           console.log('send email success');
                        }
                     });
                //    await transporter.sendMail(mailOptions);

                // transporter.sendMail(mailOptions, (error, info) => {
                //     if (error) {
                //       if (error.code === 'ETIMEDOUT') {
                //         console.error('Error sending email:', error);
                //         // Handle the error here, such as retrying the email sending operation.
                //       } else {
                //         console.error('Error sending email:', error);
                //         // Handle other types of errors here.
                //       }
                //     } else {
                //       console.log('Email sent:', info.response);
                //     }
                // });

                   console.log(mailOptions);
                // Return a success response to the client
                res.status(200).json({
                    message: "Password reset email sent! Please check your inbox."
                }); 
            }else{
                res.status(500).json({
                    "status": 500,
                    "message": "No email to system" // error.sqlMessage
                })
            }

        })
    } catch (error) {
        // Return an error response to the client
        res.status(500).json({
          message: "An error occurred while processing your request. Please try again later."
        });
    }

})

router.route('/user/forgot/reset-password')
.post(async (req, res, next) => {

    const hashedPassword    = await bcrypt.hash(req.body.password, 10)
    // const hashedToken       = await bcrypt.hash(req.body.forgot_token, 10)

    try {

        const token = req.body.forgot_token;
    
        if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });
        
        jwt.verify(token, process.env.JWT_KEY, function(err, decoded) {
  
          if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
 
          let check_expire = null
          // Check if the token has expired
          if (decoded.exp < Date.now() / 1000) {
            console.log(decoded.exp);
            check_expire = false
            return res.status(401).send({ auth: false, message: 'Token has expired.' });

          }else{
            check_expire = true
          }

          if(check_expire){
            const sql =  "SELECT id FROM employee_register WHERE forgot_token = " + `'${req.body.forgot_token}'`;

            db.query(sql, async function (err, result, fields){

                if(result){

                    let id = await result[0].id
                    let update_password = await {
                        "password"      : hashedPassword,
                        "modified_by"   : id,
                        "modified_date" : date
                    }

                    let sql_update = await 'UPDATE employee_register SET ? WHERE id = ?';

                    db.query(sql_update, [update_password, id], async function(err2, result2, fields){

                        console.log(err2);
                      
                        if (err2) res.status(500).json({
                            "status": 500,
                            "message": "Internal Server Error" // error.sqlMessage
                        })

                        res.status(200).json({
                            message: "change password complete"
                        });
                    })
                }
              
            })
    
          }
      
        });

      
    } catch (error) {
       console.log(error); 
    }
})

router.route('/user/reset-password')
.post(async (req, res, next) => {

    const hashedPassword = await bcrypt.hash(req.body.password, 10)

    try {
        let item = await{
            password        : hashedPassword,
            id              : req.body.id,
            modified_by     : req.body.id,
            modified_date   : date
        }

        const sql_update = await 'UPDATE employee_register SET ? WHERE id = ?';

        db.query(sql_update, [item, req.body.id], async function(err, result, fields){

            if (err) return res.status(500).json({
                "status": 500,
                "message": "Internal Server Error" // error.sqlMessage
            })

            res.status(200).json({
                message: "Password reset to Success.",
                data: result
            });

        })

    } catch (error) {
       console.log(error); 
    }
})

router.route('/user/register')
.post(async (req, res, next) => {
    try {

        const password = generateStrongPassword(12);

        const hashedPassword = await bcrypt.hash(password, 12)

        let item_register = await {
            "email"             : req.body.email,
            "password"          : hashedPassword,
            "name"              : req.body.name,
            "lastname"          : req.body.lastname,
            "age"               : req.body.age,
            "phone"             : req.body.phone,
            "phone_other"       : req.body.phone_other,
            "address"           : req.body.address,
            "province_id"       : req.body.province,
            "district_id"       : req.body.district,
            "subdistrict_id"    : req.body.subdistrict,
            "postcode"          : req.body.postcode,
            "check_policy"      : req.body.check_policy,
            "roles"             : 'user',
            "create_date"       : date,
            "modified_date"     : date,
        }
        let sql = await "INSERT INTO employee_register SET ?"
    
        db.query(sql,item_register, async function (error,results,fields){

            console.log(error);
    
            if (error) return res.status(500).json({
                "status": 500,
                "message": "Internal Server Error" // error.sqlMessage
            })

            item_register = await [{'id' : results.insertId,...item_register}]
            
            let updateData = await {
                "create_by"   : results.insertId,
                "modified_by" : results.insertId,
            }
  
            const sql_update = await 'UPDATE employee_register SET ? WHERE id = ?'
    
            db.query(sql_update, [updateData, results.insertId], async function (err, results2, fields){

                const result = await {
                    "status"        : 200,
                    "register_id"   : results.insertId,
                }

                var smtp = await {
                    host: 'mx.cgd.go.th', //set to your host name or ip
                    port: 25, //25, 465, 587 depend on your 
                    secure: false, // use SSL\
                    
                    // auth: {
                    //   user: 'democom3@cgd.go.th', //user account
                    //   pass: '' //user password
                    // }
                };
                var smtpTransport = await nodemailer.createTransport(smtp);
            
                // Send the password reset email
                const mailOptions = await {
                    from: "noreply@cgd.go.th",
                    to: req.body.email,
                    subject: "ลงทะเบียนสำเร็จ",
                    password: `${password}`,
                    text: `
                        URL : http://localhost:8080/
                        username : ${req.body.email} 
                        password : ${password} 
                        เข้าสู่เว็บไซต์ คลิก : http://localhost:8080/`
                };
                await smtpTransport.sendMail(mailOptions, function(error, response){
                    smtpTransport.close();
                    if(error){
                        console.log(error);
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
        console.log("errorCreateUser :",  error);
    }
})

router.route('/user/checkMail')
.post(async (req, res, next) => {

    try {

        let sql = await "SELECT email FROM employee_register WHERE email = " + `'${req.body.email}'`

        db.query(sql, async function (error,results,fields){

            // let email = await null
          
            if(results.length == 0){
                return res.status(200).json({
                    "status": 200,
                    "message": "no email" // error.sqlMessage
                })
            }else{
                return res.status(500).json({
                    "status": 500,
                    "message": "email" // error.sqlMessage
                })
          
              
            }

        })
        
    } catch (error) {
        console.log("errorCreateUser :",  error);
    }
})

router.route('/user/complain')
.post(async (req, res, next) => {

    try {

        // let item = req.body

        let item = await {
            "name"              : req.body.name,
            "lastname"          : req.body.lastname,
            "register_id"       : req.body.register_id,
            "division"          : req.body.division,
            "description_face"  : req.body.description_face,
            "topic"             : req.body.topic,
            "location"          : req.body.location,
            "start_date"        : req.body.start_date,
            "end_date"          : req.body.end_date,
            "detail"            : req.body.detail,
            "status_call"       : 0,
            "create_by"         : req.body.register_id,
            "create_date"       : date,
            "modified_by"       : req.body.register_id,
            "modified_date"     : date,
        }

        // insert table employee_register
    
        let sql = await "INSERT INTO employee_complain SET ? "
    
        db.query(sql,item, async function (error,results,fields){
  
            if (error) return res.status(500).json({
                "status": 500,
                "message": "Internal Server Error" // error.sqlMessage
            })

            item = await [{'id' : results.insertId,...item}]

            let item_step = await {
              
                "complain_id"       : results.insertId,
                "register_id"       : req.body.register_id,
                "division"          : req.body.division,
                "detail"            : req.body.detail,
                "status_call"       : 0,
                "date"              : date,
                "create_by"         : req.body.register_id,
                "create_date"       : date,
                "modified_by"       : req.body.register_id,
                "modified_date"     : date,
            }
    

            let sql_step = await "INSERT INTO employee_complain_step SET ? "

            db.query(sql_step,item_step, async function (error,results_step,fields){

                if (error) return res.status(500).json({
                    "status": 500,
                    "message": "Internal Server Error" // error.sqlMessage
                })

                item_step = await [{'id' : results_step.insertId,...item_step}]
            })

            const year = await moment().add(543, 'year').format("YY")

            let sql_select = await "SELECT COUNT(code) AS code FROM employee_reference WHERE year = " + `'${year}'`

                db.query(sql_select, async function (err, results2, fields){


                    let code =  await results2[0].code

                    let num = await parseInt(code, 10) + 1

                    let paddedNumPlusOne  = await num.toString().padStart(4, '0')

                    if(results2.length == 0){
                        code = await 1

                    }else{ 
                        code = await paddedNumPlusOne
                    
                    }
                  
                    let sql_no =  await "INSERT INTO employee_reference SET ?"

                    let item_no = await {
                        "complain_id"   : results.insertId,
                        "year"          : year,
                        "system"        : '01',
                        "code"          : code,
                        "create_by"     : req.body.register_id,
                        "create_date"   : date
                    }


                    db.query(sql_no, item_no, async function (error,results_no,fields){

                        if (error) return res.status(500).json({
                            "status": 500,
                            "message": "Internal Server Error" // error.sqlMessage
                        })
            
                        item_no = await [{'id' : results_no.insertId,...item_no}]

                        let call_no = year + '01' + code

                         let update_no = await { "call_no"   : call_no,}

                        const sql_update = await 'UPDATE employee_complain SET ? WHERE id = ?'
    
                        db.query(sql_update, [update_no, results.insertId], async function (err, results_update, fields){

                             const result = {
                                "status"        : 200,
                                "complain_id"   : results.insertId
                            }
                                return res.json(result)
                        
                            })  

                        })

                })

          

            // console.log(updateData);
  
           
        })
        
    } catch (error) {
        console.log("complain :",  error);
    }
})

router.route('/user/files')
.post(async (req, res, next) => {
    try {
        let item = await {
            "file_original"     : req.body.file_original,
            "file_name"         : req.body.file_name,
            "file_type"         : req.body.file_type,
            "register_id"       : req.body.register_id,
            "complain_id"       : req.body.complain_id,
            "create_by"         : req.body.register_id,
            "create_date"       : date,
            "modified_by"       : req.body.register_id,
            "modified_date"     : date
        }

        let sql = await "INSERT INTO employee_files SET ?"

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
        console.log('uploadFile', error);
    }
  
 

   
})

router.route('/user/edit/profile')
.post(async (req, res, next) => {
    try {

        console.log(req.body);

        let item = await {
            "email"             :   req.body.email,
            "name"              :   req.body.name,
            "lastname"          :   req.body.lastname,
            "gender"            :   req.body.gender,
            "age"               :   req.body.age,
            "phone"             :   req.body.phone,
            "phone_other"       :   req.body.phone_other,
            "address"           :   req.body.address,
            "province_id"       :   req.body.province_id,
            "district_id"       :   req.body.district_id,
            "subdistrict_id"    :   req.body.subdistrict_id,
            "postcode"          :   req.body.postcode,
            "modified_by"       :   req.body.id,
            "modified_date"     :   date
        }

        let sql = await "UPDATE employee_register SET ? WHERE id = ?"
    
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
        console.log("errorCreateUser :",  error);
    }
})

router.route('/user/uploadFiles')
.post(upload.single('images'), async (req, res, next) => {

    res.send(req.files);
})
    

module.exports = router
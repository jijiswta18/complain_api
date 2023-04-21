const express       = require('express')
const cors          = require('cors')
const moment        = require('moment')
const multer        = require('multer')
const router        = express.Router()
const db            = require('../config/db') // เรียกใช้งานเชื่อมกับ MySQL
const bcrypt        = require('bcrypt')
const jwt           = require('jsonwebtoken')
const ldap          = require('ldapjs')
const bodyParser    = require('body-parser')

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: false }));

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

// uoload file_complain_step
var storage_step = multer.diskStorage({
    destination: function (req, file, cb) {

        console.log(req.body);
        cb(null, 'public/uploads/complain_step');
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

var upload_step = multer({ storage: storage_step });

// uoload file_corrupt
var storage_corrupt = multer.diskStorage({
    destination: function (req, file, cb) {

        console.log(req.body);
        cb(null, 'public/uploads/corrupt');
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

var upload_corrupt = multer({ storage: storage_corrupt });



router.route('/backoffice/uploadStepFiles')
.post(upload_step.single('images'), async (req, res, next) => {

    res.send(req.files);
})
    
router.route('/backoffice/uploadCorruptFiles')
.post(upload_corrupt.single('images'), async (req, res, next) => {

    res.send(req.files);
})
    

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

                    let updateData = {}

                    let  newToken = await generateToken({ userId: user.id });

                  

                    if(err){
                        if(await bcrypt.compare(password, user.password)){
                    
                            updateData = await {
                                "token"     : newToken,
                                "password"  : hashedPassword,
                            }
    
                        }else{

                            res.status(400).send("error : password error");
                        }
                       
                    }else{

                        updateData = await {
                            "token"     : newToken,
                            "password_ad"  : hashedPassword,
                        }
                    }

                    console.log(updateData);
                    const sql = await 'UPDATE admin SET ? WHERE username = ?'; 
                
                    db.query(sql, [updateData, username], function (err, result2, fields) {
        
                        return res.json({userdata: user, token:newToken})
                        
                    });

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

        const hashedPassword = await bcrypt.hash(req.body.password, 10)
        let user = {
            "username"      : req.body.username,
            "password"      : hashedPassword,
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

        const hashedPassword = await bcrypt.hash(req.body.password, 10)

        let user = {
            "password"      : hashedPassword,
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



router.route('/backoffice/create/complainStep')
.post (async (req,res, next) => { 

    try {

        let item = {
            "complain_id"   : req.body.complain_id,
            "admin_id"      : req.body.admin_id,
            "register_id"   : req.body.register_id,
            "detail"        : req.body.detail,
            "date"          : date,
            "status_call"   : req.body.status_call,
            "check_corrupt" : req.body.check_corrupt,
            "create_by"     : req.body.create_by,
            "create_date"   : date,
            "modified_by"   : req.body.modified_by,
            "modified_date" : date
        }
    
        let sql = "INSERT INTO employee_complain_step SET ? "


        db.query(sql,item, async function (error,results,fields){

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

        // db.query(sql, [user, req.body.userId], (error,results,fields)=>{
    
            
        //     if (error) return res.status(500).json({
        //         "status": 500,
        //         "message": "Internal Server Error" // error.sqlMessage
        //     })
    
        //     const result = {
        //         "status": 200,
        //         "data": results
        //     }
         
        //     return res.json(result)
        // })
        
    } catch (error) {
        console.log(error);
    }

});

router.route('/backoffice/create/complainCorrupt')
.post (async (req,res, next) => { 

    try {

        let item = {
            "complain_step_id"  : req.body.complain_step_id,
            "reference_code"    : req.body.reference_code,
            "date"              : req.body.date,
            "detail"            : req.body.detail,
            "create_by"         : req.body.create_by,
            "modified_by"       : req.body.modified_by,
            "create_date"       : date,
            "modified_date"     : date
        }
    
        let sql = "INSERT INTO employee_complain_corrupt SET ? "


        db.query(sql,item, async function (error,results,fields){

            if (error) return res.status(500).json({
                "status": 500,
                "message": "Internal Server Error" // error.sqlMessage
            })

            item = [{'id':results.insertId, ...item}]

            const result = {
                "status": 200,
                "complain_corrupt_id": results.insertId,
            }

            return res.json(result)
        })  
    } catch (error) {
        console.log(error);
    }

});


router.route('/backoffice/get/listComplain')
// router.route('/backoffice/get/listComplain/:id')
.get(async (req, res, next) => {

    try {

        const sql = await "SELECT * FROM employee_complain WHERE status_call = 0"
        // const sql = await "SELECT * FROM employee_complain WHERE register_id = " + `'${req.params.id}' AND status_call = 0`

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

router.route('/get/registerDetail/:id')
.get(async (req, res, next) => {

    try {

        const sql = await "SELECT id, email, name, lastname, gender, age, phone, phone_other  FROM employee_register WHERE id = " + `'${req.params.id}'`

        db.query(sql, async function(err, result, fields){


            if (err) res.status(500).json({
                "status": 500,
                "message": "Internal Server Error" // error.sqlMessage
            })
        

            res.status(200).json({
                data: result,
                message: "success"
            })
 
        })

    } catch (error) {
        console.log(error);     
    }
})

router.route('/backoffice/complainStepFiles')
.post(async (req, res, next) => {

    console.log('======',req.body);

    try {

        let item = await {
            "file_original"     : req.body.file_original,
            "file_name"         : req.body.file_name,
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
        console.log('uploadFile', error);
    }
  
 

   
})
router.route('/backoffice/complainCorruptFiles')
.post(async (req, res, next) => {

    console.log('======',req.body);

    try {

        let item = await {
            "file_original"     : req.body.file_original,
            "file_name"         : req.body.file_name,
            "file_type"         : req.body.file_type,
            "complain_step_id"  : req.body.complain_step_id,
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
                "data": results.insertId
              }
  
            return res.json(result)

        })

    } catch (error) {
        console.log('uploadFile', error);
    }
  
 

   
})

router.route('/backoffice/get/listFollow/:id')
.get(async (req, res, next) => {

    try {

        const sql = await "SELECT * FROM employee_complain WHERE admin_id = " + `'${req.params.id}' AND status_call != 0`

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


router.route('/backoffice/get/complainStep/:id')
.get(async (req, res, next) => {

    try {

        const sql = await "SELECT * FROM employee_complain_step  WHERE complain_id = " + `'${req.params.id}'` 

        db.query(sql, async function(err, results, fields){

               
                if (err) res.status(500).json({
                    "status": 500,
                    "message": "Internal Server Error" // error.sqlMessage
                })

                res.status(200).json({
                    data: results,
                    message: "success"
                }); 

            // if(results){

            //     console.log(results);

            //     results.forEach(async function  callback(result, index) {
   
        
            //         var sql_files = await "SELECT * FROM employee_operation_files WHERE complain_step_id = " + `'${result.id}'`

            //         db.query(sql_files, async function(err2, result2, fields2){

            //             if (err) throw err;


            //             results = Object.assign({"files": result2}, result)        
                        
                    
                     
            //         })

            //         console.log(results);
      
            //     });
            //     res.status(200).json({
            //         data: results,
            //         message: "success"
            //     }); 

  
            // }
        })

    } catch (error) {
        console.log(error);     
    }

})








router.route('/backoffice/get/CorruptFiles/:id')
.get(async (req, res, next) => {

    try {

        const sql = await "SELECT * FROM employee_corrupt_files  WHERE complain_step_id = " + `'${req.params.id}'` 
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

router.route('/backoffice/get/ComplainStepFiles/:id')
.get(async (req, res, next) => {

    try {

        const sql = await "SELECT * FROM employee_operation_files  WHERE complain_step_id = " + `'${req.params.id}'` 
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



router.route('/backoffice/getUrlFiles')
.get(async (req,res, next)=> { 

    try {
        const fullUrl           = await `${req.protocol}://${req.hostname}:3000`;
        const url               = await fullUrl+"/uploads/step/"+req.query.filename;
        const imageUrlData      = await fetch(url);
        const buffer            = await imageUrlData.arrayBuffer();
        const stringifiedBuffer = await Buffer.from(buffer).toString('base64');
        const contentType       = await imageUrlData.headers.get('content-type');
        const imageBas64        = await `data:image/${contentType};base64,${stringifiedBuffer}`;


        console.log(url);
        
        // console.log(imageBas64);

        await res.send(imageBas64)
              
    } catch (error) {

        console.log(error);
        
    }

});

router.route('/backoffice/getUrlFilesCorrupt')
.get(async (req,res, next)=> { 

    try {
        const fullUrl           = await `${req.protocol}://${req.hostname}:3000`;
        const url               = await fullUrl+"/uploads/corrupt/"+req.query.filename;
        const imageUrlData      = await fetch(url);
        const buffer            = await imageUrlData.arrayBuffer();
        const stringifiedBuffer = await Buffer.from(buffer).toString('base64');
        const contentType       = await imageUrlData.headers.get('content-type');
        const imageBas64        = await `data:image/${contentType};base64,${stringifiedBuffer}`;


        console.log(url);
        
        // console.log(imageBas64);

        await res.send(imageBas64)
              
    } catch (error) {

        console.log(error);
        
    }

});

module.exports = router
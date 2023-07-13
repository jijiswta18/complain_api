
const express       = require('express')
const auth          = require('../middleware/auth')
// const cors          = require('cors')
const moment        = require('moment')
const db            = require('../config/db') // เรียกใช้งานเชื่อมกับ MySQL
const router        = express.Router()
const fetch         = require('node-fetch')
const bodyParser    = require('body-parser');
const Buffer        = require('buffer/').Buffer
const fs            = require('fs');

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: false }));

// router.use(cors({
//     "Access-Control-Allow-Origin": "origin",
// // origin: '*'
// }))


moment.locale('th');
let date = moment().format('YYYY-MM-DD HH:mm:ss');

router.route('/get/pdf/UrlFilesComplain')
.get(auth, async (req,res, next)=> { 

    try {

        var data =fs.readFileSync("public/uploads/complain/"+req.query.filename);
        res.contentType("application/pdf");
        res.send(data);
        // const url               = await "public/uploads/user/"+req.query.filename;

        // console.log(req.query.filename);


        // await res.download(url);       
    } catch (error) {
        console.log(error);  
    }

});

router.route('/get/UrlFilesComplain')
.get(auth, async (req,res, next)=> { 
    try {
        const fullUrl           = await `${req.protocol}://${req.hostname}:3000`;
        const url               = await fullUrl+"/uploads/complain/"+req.query.filename;
        const imageUrlData      = await fetch(url);
        const buffer            = await imageUrlData.arrayBuffer();
        const stringifiedBuffer = await Buffer.from(buffer).toString('base64');
        const contentType       = await imageUrlData.headers.get('content-type');
        const imageBas64        = await `data:image/${contentType};base64,${stringifiedBuffer}`;
        await res.send(imageBas64)      
    } catch (error) {
        console.log(error);  
    }
    try {
        
    } catch (error) {
        
    }
});

router.route('/get/pdf/UrlFilesComplainStep')
.get(auth, async (req,res, next)=> { 
    try {
        var data = fs.readFileSync("public/uploads/complain_step/" +req.query.filename);
        // var data = fs.readFileSync("public/uploads/complain_step/"+req.query.filename);
        res.contentType("application/pdf");
        res.send(data);
    } catch (error) {
        console.log(error);  
    }

});

router.route('/get/UrlFilesComplainStep')
.get(auth, async (req,res, next)=> { 
    try {
        const fullUrl           = await `${req.protocol}://${req.hostname}:3000`;
        const url               = await fullUrl+"/uploads/complain_step/"+req.query.filename;
        const imageUrlData      = await fetch(url);
        const buffer            = await imageUrlData.arrayBuffer();
        const stringifiedBuffer = await Buffer.from(buffer).toString('base64');
        const contentType       = await imageUrlData.headers.get('content-type');
        const imageBas64        = await `data:image/${contentType};base64,${stringifiedBuffer}`;
        await res.send(imageBas64)        
    } catch (error) {
        console.log(error);  
    }
});

router.route('/get/pdf/UrlFilesCorrupt')
.get(auth, async (req,res, next)=> { 
    try {
        var data = fs.readFileSync("public/uploads/corrupt/"+req.query.filename);
        res.contentType("application/pdf");
        res.send(data);
    } catch (error) {
        console.log(error);  
    }

});

router.route('/get/UrlFilesCorrupt')
.get(auth, async (req,res, next)=> { 
    try {
        const fullUrl           = await `${req.protocol}://${req.hostname}:3000`;
        const url               = await fullUrl+"/uploads/corrupt/"+req.query.filename;
        const imageUrlData      = await fetch(url);
        const buffer            = await imageUrlData.arrayBuffer();
        const stringifiedBuffer = await Buffer.from(buffer).toString('base64');
        const contentType       = await imageUrlData.headers.get('content-type');
        const imageBas64        = await `data:image/${contentType};base64,${stringifiedBuffer}`;
        await res.send(imageBas64)        
    } catch (error) {
        console.log(error);  
    }
});


router.route('/update/deleteCorruptFiles')
.post(auth, async (req,res, next)=> { 
    try {

        let item = {
            "check_remove"  : req.body.check_remove,
            "modified_by"   : req.body.admin_id,
            "modified_date" : date
        }
        let sql = "UPDATE employee_corrupt_files SET ? WHERE id = " + req.body.id

        db.query(sql, item, (error,results,fields)=>{

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
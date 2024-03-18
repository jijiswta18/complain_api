
const express       = require('express');
const moment        = require('moment');
const fetch         = require('node-fetch');
const auth          = require('../middleware/auth');
const db            = require('../config/db'); // เรียกใช้งานเชื่อมกับ MySQL
const router        = express.Router();
const bodyParser    = require('body-parser');
const Buffer        = require('buffer/').Buffer
const fs            = require('fs');

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: false }));

moment.locale('th');
let date = moment().format('YYYY-MM-DD HH:mm:ss');

router.route('/get/pdf/UrlFilesComplain')
.get(auth(), async (req,res, next)=> { 
    try {
        var data =fs.readFileSync("public/uploads/complain/"+req.query.filename);
        res.contentType("application/pdf");
        res.send(data);
    } catch (error) {
        console.log(error);  
    }

});

router.route('/get/UrlFilesComplain')
.get(auth(), async (req,res, next)=> { 
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
});

router.route('/get/pdf/UrlFilesComplainStep')
.get(auth(), async (req,res, next)=> { 
    try {
        var data = fs.readFileSync("public/uploads/complain_step/" +req.query.filename);
        res.contentType("application/pdf");
        res.send(data);
    } catch (error) {
        console.log(error);  
    }

});

router.route('/get/UrlFilesComplainStep')
.get(auth(), async (req,res, next)=> { 
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
.get(auth(), async (req,res, next)=> { 
    try {
        var data = fs.readFileSync("public/uploads/corrupt/"+req.query.filename);
        res.contentType("application/pdf");
        res.send(data);
    } catch (error) {
        console.log(error);  
    }

});

router.route('/get/UrlFilesCorrupt')
.get(auth(), async (req,res, next)=> { 
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

router.route('/get/pdf/UrlFilesAnnounce')
.get(auth(), async (req,res, next)=> { 
    try {
        var data = fs.readFileSync("public/uploads/announce/"+req.query.filename);
        res.contentType("application/pdf");
        res.send(data);
    } catch (error) {
        console.log(error);  
    }

});

router.route('/get/UrlFilesAnnounce')
.get(auth(), async (req,res, next)=> { 
    try {
        const fullUrl           = await `${req.protocol}://${req.hostname}:3000`;
        const url               = await fullUrl+"/uploads/announce/"+req.query.filename;
        const imageUrlData      = await fetch(url);

        console.log(imageUrlData);
        const buffer            = await imageUrlData.arrayBuffer();
        const stringifiedBuffer = await Buffer.from(buffer).toString('base64');
        const contentType       = await imageUrlData.headers.get('content-type');
        const imageBas64        = await `data:image/${contentType};base64,${stringifiedBuffer}`;
        await res.send(imageBas64)        
    } catch (error) {
        console.log(error);  
    }
});

router.route('/get/pdf/UrlFilesBanner')
.get(auth(),async (req,res, next)=> { 
    try {
        var data = fs.readFileSync("public/uploads/banner/"+req.query.filename);
        res.contentType("application/pdf");
        res.send(data);
    } catch (error) {
        console.log(error);  
    }

});

router.route('/get/UrlFilesBanner')
.get(auth(),async (req,res, next)=> { 
    try {
        const fullUrl           = await `${req.protocol}://${req.hostname}:3000`;
        const url               = await fullUrl+"/uploads/banner/"+req.query.filename;
        const imageUrlData      = await fetch(url);

        console.log(imageUrlData);
        const buffer            = await imageUrlData.arrayBuffer();
        const stringifiedBuffer = await Buffer.from(buffer).toString('base64');
        const contentType       = await imageUrlData.headers.get('content-type');
        const imageBas64        = await `data:image/${contentType};base64,${stringifiedBuffer}`;
        await res.send(imageBas64)        
    } catch (error) {
        console.log(error);  
    }
});

router.route('/update/deleteCorrupt')
.post(auth(), async (req,res, next)=> { 
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

router.route('/update/deleteCorruptFile')
.post(auth(), async (req,res, next)=> { 
    try {

        let item = {
            "file_original"         : "",
            "file_name"             : "",
            "file_type"             : "",
            "modified_by"           : req.body.admin_id,
            "modified_date"         : date
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


// USER //

router.route('/get/user/pdf/UrlFilesAnnounce')
.get(async (req,res, next)=> { 
    try {
        var data = fs.readFileSync("public/uploads/announce/"+req.query.filename);
        res.contentType("application/pdf");
        res.send(data);
    } catch (error) {
        console.log(error);  
    }

});

router.route('/get/user/UrlFilesAnnounce')
.get(async (req,res, next)=> { 
    try {
        const fullUrl           = await `${req.protocol}://${req.hostname}:3000`;
        const url               = await fullUrl+"/uploads/announce/"+req.query.filename;
        const imageUrlData      = await fetch(url);

        console.log(imageUrlData);
        const buffer            = await imageUrlData.arrayBuffer();
        const stringifiedBuffer = await Buffer.from(buffer).toString('base64');
        const contentType       = await imageUrlData.headers.get('content-type');
        const imageBas64        = await `data:image/${contentType};base64,${stringifiedBuffer}`;
        await res.send(imageBas64)        
    } catch (error) {
        console.log(error);  
    }
});

router.route('/get/user/UrlFilesBanner')
.get(async (req,res, next)=> { 
    try {
        const fullUrl           = await `${req.protocol}://${req.hostname}:3000`;
        const url               = await fullUrl+"/uploads/banner/"+req.query.filename;
        const imageUrlData      = await fetch(url);

        console.log(imageUrlData);
        const buffer            = await imageUrlData.arrayBuffer();
        const stringifiedBuffer = await Buffer.from(buffer).toString('base64');
        const contentType       = await imageUrlData.headers.get('content-type');
        const imageBas64        = await `data:image/${contentType};base64,${stringifiedBuffer}`;
        await res.send(imageBas64)        
    } catch (error) {
        console.log(error);  
    }
});

module.exports = router
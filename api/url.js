
const express       = require('express')
const auth          = require('../middleware/auth')
const cors          = require('cors');
const router        = express.Router()
const fetch         = require('node-fetch')
const bodyParser    = require('body-parser');
const Buffer        = require('buffer/').Buffer
const fs            = require('fs');

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: false }));

router.use(cors({
    //"Access-Control-Allow-Origin": "https://forqueen.cgd.go.th",
origin: '*'
}))

router.route('/get/pdf/UrlFilesComplains')
.post(async (req, res, next) => {

    try {

        console.log(req.body);

        // var data =fs.readFileSync("public/uploads/user/"+req.body.filename);
        // res.contentType("application/pdf");
        // res.send(data);
        // const url               = await "public/uploads/user/"+req.query.filename;

        // console.log(req.query.filename);


        // await res.download(url);       
    } catch (error) {
        console.log(error);  
    }
  
});



router.route('/get/pdf/UrlFilesComplain')
.get(auth, async (req,res, next)=> { 

    try {

       console.log(req.query);

        var data =fs.readFileSync("public/uploads/user/"+req.query.filename);
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
        const url               = await fullUrl+"/uploads/user/"+req.query.filename;
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
        var data = fs.readFileSync("public/uploads/complain_step/"+req.query.filename);
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
// router.route('/get/pdf/UrlFilesCorrupt')
// .get(auth, async (req,res, next)=> { 
//     try {
//         const url               = await "public/uploads/corrupt/"+req.query.filename;
//         res.download(url, function (error) {
//             console.log("Error : ", error)
//         });       
//     } catch (error) {
//         console.log(error);  
//     }
  
// });

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

module.exports = router
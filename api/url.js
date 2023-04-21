
const express       = require('express')

const router        = express.Router()
const fetch         = require('node-fetch')
const Buffer        = require('buffer/').Buffer

router.route('/get/UrlFilesComplain')
.get(async (req,res, next)=> { 
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
});

router.route('/get/UrlFilesComplainStep')
.get(async (req,res, next)=> { 
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
router.route('/get/UrlFilesCorrupt')
.get(async (req,res, next)=> { 
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
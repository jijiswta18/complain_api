
const express       = require('express');
const router        = express.Router();
const db            = require('../config/db'); // เรียกใช้งานเชื่อมกับ MySQL

router.route('/get/province')
.get(async (req, res, next) => {

    try {

        const sql = await "SELECT province_id, name_th FROM province "

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
        console.log(error);     
    }

});

router.route('/get/districts/:id')
.get(async (req, res, next) => {

    try {

        const sql = await "SELECT district_id, name_th FROM districts WHERE province_id = " + `'${req.params.id}'`

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

});

router.route('/get/subdistricts/:id')
.get(async (req, res, next) => {

    try {

        const sql = await "SELECT subdistrict_id, name_th, postcode FROM subdistricts WHERE district_id = " + `'${req.params.id}'`

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

});

router.route('/get/selectReplyMessage')
.get(async (req, res, next) => {

    try {

        const sql = await "SELECT id, message_detail, message_detail_other FROM reply_message WHERE status = 1 AND check_remove = 0"

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

});

router.route('/get/selectContactChannels')
.get(async (req, res, next) => {

    try {

        const sql = await "SELECT id, contact_name, contact_link FROM contact_channels WHERE status = 1 AND check_remove = 0"

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

});


module.exports = router
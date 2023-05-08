
const express       = require('express')
// const cors          = require('cors')
const router        = express.Router()
const db            = require('../config/db') // เรียกใช้งานเชื่อมกับ MySQL

// router.use(cors({
//     "Access-Control-Allow-Origin": "origin",
// // origin: '*'

// }));




router.route('/get/province')
.get(async (req, res, next) => {

    try {

        const sql = await "SELECT id, name_th FROM province "

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

router.route('/get/districts/:id')
.get(async (req, res, next) => {

    try {

        const sql = await "SELECT id, name_th FROM districts WHERE province_id = " + `'${req.params.id}'`

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

router.route('/get/subdistricts/:id')
.get(async (req, res, next) => {

    try {

        const sql = await "SELECT id, name_th, postcode FROM subdistricts WHERE districts_id = " + `'${req.params.id}'`

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


module.exports = router

const express       = require('express');
const router        = express.Router();
const db            = require('../config/db'); // เรียกใช้งานเชื่อมกับ MySQL




router.get('/getComplain', function (req, res, next) {

  const sql =  'SELECT tableComplain.*, tableAdmin.name as adminName, tableAdmin.lastname as adminLastname  FROM `employee_complain` AS `tableComplain` LEFT JOIN `admin` AS `tableAdmin` on tableComplain.admin_id = tableAdmin.id ORDER BY tableComplain.id DESC';

  db.query(sql, function(err, results, fields) {


    if (err) res.status(500).json({
        "status": 500,
        "message": "Internal Server Error" // error.sqlMessage
    })
    res.status(200).json(results); 

    console.log(results);
      // res.json(results);
    } 
  );
})
router.get('/getCountComplain', function (req, res, next) {

  const sql =  'SELECT status_call, COUNT(*) AS total FROM `employee_complain` GROUP BY status_call';

  db.query(sql, function(err, results, fields) {

    console.log(err);


    if (err) res.status(500).json({
        "status": 500,
        "message": "Internal Server Error" // error.sqlMessage
    })
    res.status(200).json(results); 

    console.log(results);
      // res.json(results);
    } 
  );
})


module.exports = router
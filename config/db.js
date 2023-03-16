require("dotenv").config();
const mysql = require('mysql') // เรียกใช้งาน MySQL module
 
// กำหนดการเชื่อมต่อฐานข้อมูล
// const db = mysql.createPool({
//     connectionLimit : 10,
//     host      : 'localhost',
//     port      :'3306',
//     user      : 'root',
//     password  : '',
//     database  : 'cgd_festival', 
//     ssl       : true,
//     debug     : false
//   })

const db = mysql.createPool({
    connectionLimit : 10,
    host      : process.env.HOST,
    port      : process.env.PORT,
    user      : process.env.USER,
    password  : process.env.PASSWORD,
    database  : 'cgd_login', 
    // ssl       : true,
    ssl       : false,
    debug     : false
  })


// ทำการเชื่อมต่อกับฐานข้อมูล 
// db.connect((err) =>{
//     if(err){ // กรณีเกิด error
//         console.error('error connecting: ' + err.stack)
//         return
//     }
//     // console.log('connected as id ' + db.threadId)
// })
// ปิดการเชื่อมต่อฐานข้อมูล MySQL ในที่นี้เราจะไม่ให้ทำงาน
// db.end() 
module.exports = db
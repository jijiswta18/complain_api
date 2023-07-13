const jwt       = require('jsonwebtoken');
const fs        = require('fs');
const moment    = require('moment');
const db        = require('../config/db'); // เรียกใช้งานเชื่อมกับ MySQL



const verifyToken = (req, res, next) => {

    // const token = req.body.token || req.query.token || req.headers['authorization'];
    const authorization = req.headers['authorization'] 

    if(authorization===undefined) return res.status(401).json({
      
        "status": 401,
        "message": "Unauthorized"
    })   

    const token = req.headers['authorization'].split(' ')[1]

    if(token===undefined) return res.status(401).json({ // หากไมมีค่า token
        "status": 401,
        "message": "Unauthorized"
    })  
    // const secretKey = process.env.JWT_KEY; // Use environment variable
    var cert = fs.readFileSync('jwtRS256.key.pub');

    try {
  
        const decoded = jwt.verify(token, cert);

        const sql = "SELECT token.expire, token.revoke FROM token WHERE token = " + `'${token}'`

        db.query(sql,  function(err, result, fields){
            if(result[0].revoke !== '0'){
                res.status(401).json({
                    "status": 401,
                    "error": "Invalid Token" // error.sqlMessage
                })

                res.send({
                    // order details
                  })
            
            }else{
                const currentTimestamp = Math.floor(Date.now() / 1000);

                const expiresIn = 3600; // Expires in 1 hour (adjust as needed)
        
                const newExpiration = currentTimestamp + expiresIn;
        
                const momentObj = moment.unix(newExpiration);
        
                const formattedDateTime = momentObj.format('YYYY-MM-DD HH:mm:ss');
        
                const sql_update = 'UPDATE token SET ? WHERE token = ?'
        
                db.query(sql_update,[{"expire" : formattedDateTime}, token], function (error,results_token,fields){

                    if (error) return res.status(500).json({
                        "status": 500,
                        "message": "Internal Server Error" // error.sqlMessage
                    })
                    
                })
            }

            

            // if (err) res.status(500).json({
            //     "status": 500,
            //     "message": "Internal Server Error" // error.sqlMessage
            // })

        })

        req.user = decoded;


    }catch(err) {
        console.log('catch :' + err);
        return res.status(401).send("Invalid Token");
    }

    // const currentTime = Math.floor(Date.now() / 1000); // Convert current time to seconds
    // if (cert.exp && cert.exp < currentTime) {
    //   console.log('JWT token has expired');
    // } else {
    //   console.log('JWT token is still valid');
    //   // Token is valid, proceed with the desired logic
    // }

    return next();
}

module.exports = verifyToken;
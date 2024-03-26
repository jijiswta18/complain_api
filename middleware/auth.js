const db        = require('../config/db'); // เรียกใช้งานเชื่อมกับ MySQL
const jwt       = require('jsonwebtoken');
const fs        = require('fs');
const moment    = require('moment');

const cert = fs.readFileSync('jwtRS256.key.pub');


module.exports = () => {
    return (req, res, next) => {

        const authorization = req.headers['authorization'];

     

        if (!authorization) {
            return res.status(401).send("Unauthorized: No authentication header");
        }

        const token = req.headers['authorization'].split(' ')[1];

        console.log('=>>>>>>>>>>>>>',req.headers['authorization'].split(' ')[1])

        if (!token) {
            return res.status(401).send("token: No authentication header");
        }


        try {

            const checkDecoded = jwt.decode(token, { complete: true });

            var dataDecoded = null

            if(checkDecoded.payload.role === 'user'){

                dataDecoded = jwt.verify(token, '', { algorithms: ['none'] }, function(err, decoded) {
                    if (err) {
                      console.error('Token verification failed:', err.message);
                    } else {
                    console.log('Decoded Token:', decoded);
                    }
                });

            }else{

                dataDecoded = jwt.verify(token, cert, { algorithm: 'RS256' }, function(err, decoded) {
                    if (err) {
                        console.error('>>>>>>>>>>>>>Token verification failed:', err.message);
                    } else {
                    console.log('Decoded Token:', decoded);
                    }
                });

            } 
    
            // const decoded = jwt.verify(token, cert, { algorithm: 'RS256' });
            // const decoded = jwt.verify(token, cert, { algorithm: 'RS256' });
           
            const sql = "SELECT token.expire, token.revoke FROM token WHERE token = " + `'${token}'`;

            db.query(sql, (error, result) => {
           
                const revoke = result[0].revoke;
                const expirationDate = result[0].expire;

                if(revoke === 1){
                    return res.status(401).send("Invalid Token");
                }else if(new Date() > new Date(expirationDate)){
                    return res.status(401).send("Token Expire");
                
                }else{

                    const currentTimestamp = Math.floor(Date.now() / 1000);

                    const expiresIn = 3600; // Expires in 1 hour (adjust as needed)
                
                    const newExpiration = currentTimestamp + expiresIn;
                
                    const momentObj = moment.unix(newExpiration);
                
                    const formattedDateTime = momentObj.format('YYYY-MM-DD HH:mm:ss');
    
                    const sql_update = 'UPDATE token SET ? WHERE token = ?'

                    db.query(sql_update,[{"expire" : formattedDateTime}, token], function (error,results_token,fields){
    
                        console.log('UPDATE token');
    
                        // if(error){
                        //     return res.status(500).json({ error: 'Internal Server Error' });
                        // }
    
                        if (error) return res.status(500).json({
                            "status": 500,
                            "message": "Internal Server Error" // error.sqlMessage
                        })

                        req.user = dataDecoded;
    
                        next();
    
                        // return next();
    
                    })
                 
                }
            });

            // console.log(sql);

        } catch (error) {
            console.log(error);
        }

     

       
    };
};
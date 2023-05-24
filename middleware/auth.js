const jwt = require('jsonwebtoken');



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

    const secretKey = process.env.JWT_KEY; // Use environment variable

    try {
  
        const decoded = jwt.verify(token, secretKey);
        
        req.user = decoded;

        // console.log(req.user);

        // console.log('===========', decoded);

    }catch(err) {
        return res.status(401).send("Invalid Token");
    }

    return next();
}

module.exports = verifyToken;
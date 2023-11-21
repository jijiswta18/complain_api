const express       = require('express');
const moment        = require('moment');
const fileUpload    = require('express-fileupload'); 
const bodyParser    = require('body-parser');
const db            = require('./config/db'); // เรียกใช้งานเชื่อมกับ MySQL
const app           = express();


app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(fileUpload({}));

// app.use(cors({origin: '*'}));

// ใช้งาน router module
const userApi       = require('./api/user');
const officerApi    = require('./api/officer');
const selectApi     = require('./api/select');
const urlFilesApi   = require('./api/url');
const reportApi   = require('./api/report');
const controller    = require('./controller');
// เรียกใช้งาน indexRouter
app.use('/api', [userApi, officerApi, selectApi, urlFilesApi, reportApi]);

app.use(express.static('public'));


app.use(( req, res, next) => {
  // res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8088');
  // res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH');
//   res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('X-XSS-Protection', '1; mode=block');

  
  next();
});



app.post('/api/uploadsFile', controller.uploadFile, (req, res) => {

    console.log(req.files);
  
  });

app.post('/api/logout', async (req, res, next) => {

    try {

        const token = req.headers['authorization'].split(' ')[1]

        const currentTimestamp = Math.floor(Date.now() / 1000);

        const momentObj = moment.unix(currentTimestamp);

        const formattedDateTime = momentObj.format('YYYY-MM-DD HH:mm:ss');

        let sql_token = await 'UPDATE token SET ? WHERE token = ?'

        let update_token = await {
            "expire"   : formattedDateTime,
            "revoke" : '1',
        }

        db.query(sql_token, [update_token, token], async function (error,results_token,fields){

            if (error) return res.status(500).json({
                "status": 500,
                "message": "Internal Server Error" // error.sqlMessage
            })

            res.send({msg : 'You have been Logged Out' });  
        })
    } catch (error) {
        console.log('logout',error);
    }
})


app.listen(3000, () =>{
    console.log('Server is listening on port 3000...')
});

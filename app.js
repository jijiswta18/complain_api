const express       = require('express');
// const cors          = require('cors');
const bodyParser    = require('body-parser');
const app           = express();
// var path            = require('path');

// console.log(path);

app.use(bodyParser.json());

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', 'origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
  });
// app.use(cors({origin: '*'}));

// ใช้งาน router module
const userApi       = require('./api/user');
const officerApi       = require('./api/officer');
const selectApi       = require('./api/select');
const urlFilesApi       = require('./api/url');
// เรียกใช้งาน indexRouter
app.use('/api', [userApi, officerApi, selectApi, urlFilesApi]);

app.use(express.static('public'));

// ใชคำส่ัง path.join เพื่อเชื่อม path เต็ม ของไฟล์ myform.html
// app.get('/', function (req, res) {
//     // res.sendFile("C:\\projects\\expressjs\\public\\myform.html")
//     res.sendFile(path.join(__dirname,'public/uploads/user'))
// })
// app.use('/', express.static(__dirname + '/public'));
// app.use('/', express.static(path.join(__dirname, '/public')))
// app.get('/api', (req, res)=>{
//     // res.set('Content-Type', 'text/html');
//     // res.status(200).send("<h1>Hello GFG Learner!</h1>");
//     res.send('Hello World!');
// });

app.listen(3000, () =>{
    console.log('Server is listening on port 3000...')
});

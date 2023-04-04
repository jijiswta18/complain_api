const express       = require('express');
const cors          = require('cors');
const bodyParser    = require('body-parser');
const app           = express();

app.use(bodyParser.json());
app.use(cors({origin: '*'}));

// ใช้งาน router module
const userApi       = require('./api/user');
const officerApi       = require('./api/officer');
const selectApi       = require('./api/select');
// เรียกใช้งาน indexRouter
app.use('/api', [userApi, officerApi, selectApi]);

app.use(express.static('public'));

// app.get('/api', (req, res)=>{
//     // res.set('Content-Type', 'text/html');
//     // res.status(200).send("<h1>Hello GFG Learner!</h1>");
//     res.send('Hello World!');
// });

app.listen(3000, () =>{
    console.log('Server is listening on port 3000...')
});

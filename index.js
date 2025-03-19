const express = require('express');
const app = express();
const db = require('./middelware/db')
const appbackend = require('./app/app')
app.use('/app',appbackend)
const dashboard = require('./dashboard/dashboard')
app.use('/dashboard',dashboard)



app.listen(3000)

const express = require('express');
const cors = require('cors');
const mysql = require('mysql');
const app = express();
const SQL = require('sql-template-strings')
var bodyParser = require('body-parser');
var session = require('express-session');
var urlencodedParser = bodyParser.urlencoded({ extended: true })
var act_value;
var logged = 0;
const SELECT_ALL_READINGS_QUERY = 'SELECT * FROM readings';
app.use(session(
    {
        saveUninitialized: false,
        resave: false,
        secret: 'There is no spoon',
        cookie:
        {
            maxAge: 1000 * 60 * 60 * 2 //2 hours
        }
    }
))

var session_checker = (req, res, next) => { //if user is logged in, trying to access login page will redirect to dash.
    if (req.session.user_id) {
        res.redirect('/dash');
    } else {
        next();
    }    
};

const db_conn = mysql.createConnection(
{
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'iot'
});
    db_conn.connect(err => {if(err) {return err;}});

port = process.argv[2];
app.set('view engine', 'ejs');
app.use(cors());

app.route('/')
    .get(function(req, res)
    {
        res.render('index',{
            sess: req.session
        })
    })

app.route('/dash')
    .get(function(req,res)
        {
        if (req.session.user_id)
        {
            res.render('dash', {
                sess: req.session
            })
        }
        else
        {
            res.redirect('/')
        }    
        })

app.get('/readings', (req,res) => 
{
    
    db_conn.query(SELECT_ALL_READINGS_QUERY, function(error, results, fields) 
    {
        if(error) 
        {
            console.log(error);
          //  return;
        }
        else
        {
            //console.log(results)
            res.render('readings',
            {
                data : results,
                tagline : tagline
            });
        }
    });
    var tagline = "this should show the readings.";
});

app.route('/actuators')
    .get(function(req, res)
    {
        res.render('actuators')
    })
    .post(urlencodedParser, function(req, res)
    {
        act_value = req.body.act_value;
        console.log("Actuator set to = " + act_value);
        const query = SQL`INSERT into actuators (act_value) VALUES (${act_value})`;
        db_conn.query(query, function(error, results, fields) 
        {
            if(error) 
            {
                //console.log(act_value);
                console.log(error);
            }
            else
            {
                console.log(req.body);
                res.render('actuator-success', {data: req.body});
            }
        });
    });
    
app.route('/login')
    .get(session_checker, function(req, res)
    {
        res.render('login')
    })
    .post(urlencodedParser, function(req, res)
    {
        user_name = req.body.uname;
        password = req.body.pass;
        console.log('Login attempt with user: ' + user_name, ' and password: ' + password);
        const query = SQL`SELECT * FROM users WHERE user_name = ${user_name} AND  pass = ${password}`;
        db_conn.query(query, function(error, results, fields) 
        {
            if(error)
            {
                console.log(error)
                
            }
            if (!results[0])
            {
                console.log('Bad login')
                res.send('Bad login')
                return;
            }
            else
            {
                req.session.user_id = user_id = results[0].user_id;
                req.session.user_priv = results[0].priv_level;
                req.session.user_name = results[0].user_name;
                console.log('User ' + user_name, 'has logged in successfully with ID ' + user_id)
                //console.log(req.session)
                res.render('index',
                {
                    sess: req.session,
                })
            }
    });       
});    

app.get('/logout', (req,res) =>
{
    req.session.destroy()
    res.redirect('/')
})

app.listen(port,() => 
{
    console.log('Server listening on port', port)
});
const express = require('express');
const cors = require('cors');
const mysql = require('mysql');
const app = express();
const SQL = require('sql-template-strings')
const bodyParser = require('body-parser');
const session = require('express-session');
const urlencodedParser = bodyParser.urlencoded({ extended: true })
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

const session_checker = (req, res, next) => { //if user is logged in, trying to access login page will redirect to dash.
    if (req.session.user_id)    res.redirect('/dash'); 
    else                        next();
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
            sess: req.session,
            page_title: 'Home',
        })
    })

app.route('/dash')
    .get(function(req,res)
    {
        if (req.session.user_id)
        {
            res.render('dash', {
                sess: req.session,
                page_title: 'Dashboard'
            })
        }
        else
        {
            res.redirect('/')
        }    
    })

app.get('/readings', (req,res) => 
{
    if (req.session.user_id && req.session.user_priv >= 1)
    {
        db_conn.query(SELECT_ALL_READINGS_QUERY, function(error, results, fields) 
        {
        if(error) console.log(error);
        else
        {
            res.render('readings',
            {
                data : results,
                page_title: 'Readings'
            });
        }
        });
    }
    else    res.redirect('/')
});

app.route('/actuators')
    .get(function(req, res)
    {
        res.render('actuators',
        {
            page_title: 'Set Actuators'
        })
    })
    .post(urlencodedParser, function(req, res)
    {
        const act_value = req.body.act_value; //Not pushing act value directly assuming there will be some form of sanitization
        console.log("Actuator set to = " + act_value);
        const query = SQL`INSERT into actuators (act_value) VALUES (${act_value})`;
        db_conn.query(query, function(error, results, fields) 
        {
            if(error) console.log(error);
            else
            {
                console.log(req.body);
                res.render('actuator-success',
                {
                    data: req.body,
                    page_title: 'Set Actuators'
                });
            }
        });
    });
    
app.route('/login')
    .get(session_checker, function(req, res)
    {
        res.render('login',
        {
            page_title: 'Login'
        })
    })
    .post(urlencodedParser, function(req, res)
    {
        user_name = req.body.uname;
        password = req.body.pass;
        console.log('Login attempt with user: ' + user_name, ' and password: ' + password);
        const query = SQL`SELECT * FROM users WHERE user_name = ${user_name} AND  pass = ${password}`;
        db_conn.query(query, function(error, results, fields) 
        {
            if(error)   console.log(error)
            else if (!results[0])
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
                res.render('index',
                {
                    sess: req.session,
                    page_title: 'Home'
                })
            }
    });       
});    

app.get('/logout', (req,res) =>
{
    if (req.session.user_id)
    {
        req.session.destroy()
        res.redirect('/')
    }
    else    res.redirect('/')
})

app.listen(port,() => 
{
    console.log('Server listening on port', port)
});
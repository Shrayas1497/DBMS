const express = require('express')
// var path = require('path')
const app = express()
const bodyParser = require('body-parser')
const mysql = require('mysql')
const session = require('express-session')
const cookieParser = require('cookie-parser')
const urlencodedParser = bodyParser.urlencoded({ extended: false })
const chef = require('./chef')
const admin = require('./admin')

app.set('view engine','ejs')
app.use('/assets',express.static('assets')) //describing the static files folder
app.use(cookieParser());

//session
var MemoryStore = session.MemoryStore;

app.use(session({
    name : 'app.sid',
    secret: "1234567890QWERTY",
    resave: true,
    store: new MemoryStore(),
    saveUninitialized: true
}))


// app.use(express.static( path.join(__dirname, 'public')));
const con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database:"project"
})

con.connect(function(err) {
    if (err) throw err;
        console.log("Database Connected!")
})

chef(app, urlencodedParser, con)
admin(app, urlencodedParser, con)

app.get('/',(req,res) => {
    console.log("Get Request @ -> " + req.url);
    if(req.session.chef == true){
        if(req.session.user){
            res.render('index', {user: true, chef: true, admin: false})
        }
        else{
            res.render('index', {user: false, chef: false, admin: false})
        }
    }
    else if(req.session.admin == true){
        res.render('index', {user: true, chef: false, admin: true})
    }
    else{
        if(req.session.user){
            res.render('index', {user: true, chef: false, admin: false})
        }
        else{
            res.render('index', {user: false, chef: false, admin: false})
        }
    }

})

//logout
app.get('/logout', (req,res) => {
    console.log("Get Request @ -> " + req.url);
    if(req.session.id){
        req.session.destroy()
    }
    res.redirect('/')
})

//login
app.get('/login',(req,res) => {
    console.log("Get Request @ -> " + req.url);
    res.render('login', {msg: false})
})

app.post('/login', urlencodedParser,(req,res) => {
    console.log("POST Request @ -> " + req.url);
    let flag = 1;
    let email = req.body.email
    let password = req.body.password
    let data = [email, password]
    console.log(data)
    // con.query("SELECT * FROM loginCustomer WHERE email='" + email + "' AND password='" + password + "'", (err, result) => {
    con.query('call custLogin(?, ?)', data, (err, result) => {  
        if (err) console.error(err)

        console.log(result[0])
        if(result[0].length == 0){
            flag = 0;
        }
        else{
            req.session.user = result[0][0].email;
            req.session.cust_id = result[0][0].cust_id
        }
    })

    setTimeout(() => {
        if(flag == 0){
            res.render('login', {msg: true})
        }
        else{
            res.redirect('/')
        }
    }, 100)
    })

// GET signup
app.get('/signup', (req, res) => {
    res.render('signup')
})

//POST signup
app.post('/signup', urlencodedParser,(req,res) => {
    console.log("Get Request @ -> " + req.url);
    let body = req.body
    let name = body.name
    let email = body.email
    let password = body.password
    let password2 = body.password2
    let address = body.address
    let phone = body.phone
    let qs = "INSERT INTO customer VALUES(null, ?, ?, ?, ?, ?)"
    let data = [name, address, phone, email, password]
    if(password === password2){
        con.query(qs,data, (err, result) => {
            if (err) console.error(err)
            console.log("sussfull entry!")
        })
    }
    else{
        res.render('login')
    }

    setTimeout(() => {
        res.redirect('/')
    }, 100)
})



//reservation
app.post('/reservation', urlencodedParser, (req,res) => {
    let body = req.body
    console.log("POST Request @ -> " + req.url);
    console.log(body)
    let row,row2;
    let qs = "SELECT * FROM chef,category WHERE chef.speciality=category.cat_id AND cat_name LIKE \'%"+body.option+"%\'";
    con.query(qs, (err,result) => {
        if (err) console.error(err)
        row = result
    })
    
    let qs2 = "SELECT * FROM booking_details WHERE on_date='"+ body.date +"' AND chef_id IN (SELECT chef_id FROM chef,category WHERE chef.speciality=category.cat_id AND cat_name LIKE \'%"+body.option+"%\')"
    setTimeout(() => {
        con.query(qs2, (err,result) => {
            if (err) console.error(err)
            row2 = result
        })
    }, 100)

    setTimeout(() => {
        // console.log(row, row2)
        let av = []
        let unav = []
        let flag = 0
        for(let i=0;i< row.length; i++){
            // console.log("row2 chef id = " + row2[0].chef_id + "  row chef id is " + row[i].chef_id)
            flag = 0
            for(let j=0; j< row2.length; j++){
                if(row[i].chef_id == row2[j].chef_id){
                    unav.push(row[i])
                    flag = 1
                }    
            }

            if(flag == 0){
                av.push(row[i])
            }
        }

        // console.log("unav is : ")
        // console.log(unav,row)

        // console.log("av is")
        // console.log(av, row2)
        let search = "&venue=" + body.venue + "&date="+ body.date.replace('/', '%2F')
        search += "&note=" + body.note.replace(' ', '+') 
        if(row.length == 0){
            res.redirect('/')
        }else{
            if(req.session.user){
                res.render('reseravations', {user: true,result: av, result2: unav, detail: search})
            }
            else{
                res.render('reseravations', {user: false,result: av, result2: unav, detail: search})
            } 
        }
    } , 200)
    // res.render('reseravations', {result: row})
})


app.get('/book', (req,res) => {
    console.log("Get Request @ -> " + req.url)
    if(req.session.user){
        let qs = "INSERT INTO booking_details VALUES (null, ?, ?, ?, ?, ?)"
        let venue = req.query.venue
        let cust_email = req.session.user
        let chef_id = req.query.chef
        let date = req.query.date
        let price = req.query.price
        let data = [venue,cust_email, chef_id, date, price]
        let note = req.query.note
        console.log(data)
        let flag = 0
        let row;
        
        con.query(qs,data, (err , result) => {
            if (err) console.error(err)
            console.log("sussfull booking")
            flag = 1
        })

        let kk = "SELECT * FROM booking_details bb, venue v, customer cu, chef c where bb.Venue_id=v.venue_id and cu.email=bb.cust_email and c.chef_id=bb.chef_id ORDER BY book_id DESC LIMIT 1;"

        setTimeout(() => {
            con.query(kk, (err,result) => {
                if (err) console.error(err)
                row = result
            })
        }, 100)
        // SELECT * FROM booking_details bb, venue v, customer cu, chef c where bb.Venue_id=v.venue_id
        // and cu.cust_id=bb.cust_id and c.chef_id=bb.chef_id
        setTimeout(() => {
            if(flag == 1){
                console.log("This is table row")
                console.log(row)
                res.render('booking', {result: row[0], event: note})
            }
            else{
                res.redirect('/')
            }
        }, 200)
    }
    else{
        res.redirect('/login')
    }
})









app.listen(3000, (err) => {
    if(err)
        console.log(err)
    else
        console.log('Listening at port 3000')
})
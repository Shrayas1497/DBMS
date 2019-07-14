module.exports = function(app, urlencodedParser, con){

    app.get('/chefLogin', (req, res) => {
        console.log('GET Request @ -> ' + req.url)
        res.render('chefLogin', {msg: false})
        
    })

    app.get('/chefSignup', (req, res) => {
        res.render('chefsignup')
    })

    app.post('/chefUpdate',urlencodedParser, (req,res) => {
        console.log('POST Request @ -> ' + req.url)
        let body = req.body

        let email = body.email
        let password = body.password
        let name = body.name
        let address = body.address
        let phone = body.phone
        let basic = body.base
        let speciality = body.special

        let qs = "UPDATE chef SET chef_name='" + name + "', "
        qs += "chef_email='"+email+"', chef_password='"+ password +"', "
        qs += "chef_address='" + address + "', chef_phone='" + phone +"', "
        qs += "basic_price='" + basic + "', speciality='" + speciality + "' WHERE chef_email='"
        qs += req.session.user + "'"

        con.query(qs, (err, result) => {
            if (err) console.error(err)

            console.log('Sucess Updation')
        })
        
        setTimeout(() => {
            res.redirect('/')
        }, 100)
    })

    app.get('/chefOrder', (req, res) => {
        let row;
        let email = req.session.user
        let qs = "SELECT cust_name,cust_email,on_date, venue_name, contact_person, contact_phone "
        qs += "FROM booking_details c, venue v, customer cu, chef cf WHERE c.cust_email=cu.email AND c.Venue_id=v.venue_id"
        qs += " AND c.chef_id=cf.chef_id AND cf.chef_email='" + email +"'" 
        con.query(qs, (err, results) => {
            if(err) console.error(err)
            row = results
        })

        setTimeout(() => {
            console.log(row)
            if(req.session.user){
                res.render('chefOrder', {user: true, orders: row})
            }
            else{
                res.redirect('/')
            }
        }, 100)
    })

    app.get('/chefProfile', (req, res) => {
        console.log('GET Request @ -> ' + req.url)
        let row;
        if(req.session.user){
            let qs = "SELECT * FROM chef WHERE chef_email='" + req.session.user + "'";

        con.query(qs, (err, result) => {
            if (err) console.error(err)
            if(result.length != 0){
                row = result[0]
            }
            else
                row = null
        })
        }

        setTimeout(() => {
            if(row == null){
                res.redirect('/')
            }
            else{
                if(req.session.user){
                    res.render('chefProfile', {user: true, chef: row})
                }
                else{
                    res.redirect('/')
                }
            }
        } ,100)
        
    })

    app.post('/chefLogin', urlencodedParser, (req, res) => {
        console.log("POST Request @ -> " + req.url);
        let flag = 1;
        let email = req.body.email
        let password = req.body.password
        con.query("SELECT * FROM chef WHERE chef_email='" + email + "' AND chef_password='" + password + "'", (err, result) => {
            if (err) console.error(err)
            if(result.length == 0){
                flag = 0;
            }
            else{
                req.session.user = email
                req.session.chef = true
            }
        })

        setTimeout(() => {
            if(flag == 0){
                res.render('chefLogin', {msg: true})
            }
            else{
                res.redirect('/')
            }
        }, 100)
    })

    app.post('/chefRegistration', urlencodedParser, (req, res) => {
        console.log("POST request @ -> " + req.url)
        let body = req.body;
        let name = body.name
        let email = body.email
        let pass1 = body.password
        let pass2 = body.password2
        let address = body.address
        let basic = body.basicPrice
        let special = body.special
        let phone = body.phone
        let data = [email, pass1, name, address, phone, basic, special]
        let qs = "INSERT INTO chef VALUES(null, ?, ?, ?, ?, ?, ?, ?)"

        if(pass1 == pass2){
            con.query(qs, data, (err, result) => {
                if (err) console.error(err)

                console.log("Sucess in insertion of chef ");
            })

            setTimeout(() => {
                res.redirect('/')
            }, 100)
        }
        else{
            res.redirect('/chefRegistration')
        }
    })

}
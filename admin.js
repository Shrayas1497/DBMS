module.exports = function(app, urlencodedParser, con){
    app.get('/adminLogin', (req, res) => {
        console.log('GET Request @ -> ' + req.url)
        res.render('adminLogin', {msg: false})  
    })

    app.post('/adminLogin', urlencodedParser, (req, res) => {
        console.log("POST Request @ -> " + req.url);
        let flag = 1;
        let username = req.body.username
        let password = req.body.password
        con.query("SELECT * FROM administrator WHERE username='" + username + "' AND password='" + password + "'", (err, result) => {
            if (err) console.error(err)
            if(result.length == 0){
                flag = 0;
            }
            else{
                req.session.user = username
                req.session.admin = true
            }
        })

        setTimeout(() => {
            if(flag == 0){
                res.render('adminLogin', {msg: true})
            }
            else{
                res.redirect('/')
            }
        }, 100)
    })

    app.get('/adminOrders', (req, res) => {
        console.log('Administrator user')
        if(req.session.admin == true){
            let row;
            let qs = "SELECT book_id,chef_name,chef_email,cust_name,cust_email,on_date, venue_name, contact_person, contact_phone "
            qs += "FROM booking_details c, venue v, customer cu, chef cf WHERE c.cust_email=cu.email AND c.Venue_id=v.venue_id"
            qs += " AND c.chef_id=cf.chef_id"

            con.query(qs, (err, results) => {
                if(err) console.error(err)
                row = results
            })

            setTimeout(() => {
                // console.log(row)
                res.render('adminOrder', {user: true,orders: row})
            }, 100)
        }
        else{
            res.redirect('/logout')
        }
    })

    app.get('/delete', (req, res) => {
        if(req.session.admin){
            let order = req.query.orderId
            let qs = "DELETE FROM booking_details WHERE book_id=" + order
            con.query(qs, (err, result) => {
                if(err) console.error(err)
                console.log("Deleted the Booking of id " + order)
            })

            setTimeout(() => {
                res.redirect('/adminOrders')
            }, 100)
        }
        else{
            res.redirect('/logout')
        }
    })
};
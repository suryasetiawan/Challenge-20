var express = require("express");
var bodyParser = require("body-parser");
var path = require("path");
var sqlite3 = require("sqlite3").verbose();
var db = new sqlite3.Database("bread.db");

var app = express();

// View Engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Body Parser Middleware
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: false
  })
);

// Set Static Path
app.use(express.static(path.join(__dirname, "public")));

// berkunjung ke router http://localhost:3000/
app.get("/", (req, res) => {
  let params = [];
  let filter = false;
  let page = req.query.page || 1;
  let limitpage = 4;
  let offset = (page - 1) * limitpage;
  let url = req.url == '/' ? '/ ? page=1' : req.url

  if (req.query.checkid && req.query.id) {
    params.push(`id = ${req.query.id}`);
    filter = true;
  }
  if (req.query.checkstring && req.query.string) {
    params.push(`string like '%${req.query.string}%'`);
    filter = true;
  }
  if (req.query.checkinteger && req.query.integer) {
    params.push(`integer = ${req.query.integer}`);
    filter = true;
  }
  if (req.query.checkfloat && req.query.float) {
    params.push(`float = ${req.query.float}`);
    filter = true;
  }
  if (req.query.checkdate && req.query.startdate && req.query.enddate) {
    params.push(`date between '${req.query.startdate}' and '${req.query.enddate}'`);
    filter = true;
  }
  if (req.query.checkboolean && req.query.boolean) {
    params.push(`boolean = '${req.query.boolean}'`);
    filter = true;
  }
  let sql = `select count(*) as total from data`;
  if (filter) {
    sql += ` where ${params.join(' and ')}`
    // console.log(sql);
  }
  db.all(sql, (err, count) => {
    const total = count[0].total;
    const pages = Math.ceil(total / limitpage);
    sql = `select * from data`;
    if (filter) {
      sql += ` where ${params.join(' and ')}`
    }
    sql += ` limit ${limitpage} offset ${offset}`;

    db.all(sql, (err, rows) => {
      res.render('index', {
        data: rows,
        query: req.query,
        page,
        pages,
        url
      });
    });
  });
})

app.get('/add', (req, res) => {
  res.render('add');
})

app.post("/add", (req, res) => {
  let string = req.body.string;
  let integer = req.body.integer;
  let float = req.body.float;
  let date = req.body.date;
  let boolean = req.body.boolean
  db.run(
    `insert into data(string, integer, float, date, boolean) values('${string}','${integer}','${float}','${date}','${boolean}')`,
    err => {
      if (err) throw err;
      res.redirect("/");
    }
  );                         
});

function getData(cb) {
  db.all("select * from data", (err, rows) => {
    if (err) throw err;
    cb(rows);
  });
}

app.get("/edit/:id", (req, res) => {
  getData(rows => {
    let id = req.params.id;
    let index = 0;
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].id == id) {
        index = i;
      }
    }
    res.render("edit", {
      item: rows[index]
    });
  });
});


app.post("/edit/:id", (req, res) => {
  let string = req.body.string;
  let integer = req.body.integer;
  let float = req.body.float;
  let date = req.body.date;
  let boolean = req.body.boolean

  db.run(
    `update data set (string, integer, float, date, boolean) = ('${string}','${integer}','${float}','${date}','${boolean}') where id= '${req.params.id}'`,
    err => {
      if (err) throw err;
      res.redirect('/');
    });
});




app.get("/delete/:id", function (req, res) {
  db.run(`delete from data where id = ${req.params.id}`, err => {
    if (err) throw err;
    res.redirect("/");
  });
});

app.listen(3000, function () {
  console.log("Server started on Port 3000...");
});

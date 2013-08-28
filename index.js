// Router
var Router = function() {
  this.routes = {
    'POST': [],
    'PUT': [],
    'DELETE': [],
    'GET': []
  }
}

Router.prototype.addRoute = function(regex, method, fn) {
  this.routes[method].push({ path: regex, func: fn })
}

Router.prototype.dispatch = function(req, res) {
  var methods = this.routes[req.method]
  for(var i = 0, method = methods[i]; method = methods[i]; i++) {
    if(method.path.test(req.url)) return method.func(req, res)
  }

  res.statusCode = 404
  res.end()
}



// Body Parser
var util = require("util")
var Transform = require("stream").Transform
var BodyParser = function() {
  Transform.call(this)
  this._body= ""
  this._readableState.objectMode = true;
  this._writableState.objectMode = false;
}
util.inherits(BodyParser, Transform)

BodyParser.prototype._transform = function(chunk, encoding, done) {
  this._body += chunk
  done()
}

BodyParser.prototype._flush = function(fn) {
  var parsed
  try {
    parsed = JSON.parse(this._body)
    this.push(JSON.parse(this._body))
  } catch(e) {
    this.emit("error", e)
  }
  fn()
}

// Result Stringify
var ResultStringify = function() {
  Transform.call(this)
  this._readableState.objectMode = false;
  this._writableState.objectMode = true;
}
util.inherits(ResultStringify, Transform)

ResultStringify.prototype._transform = function(chunk, encoding, done) {
  this.push(JSON.stringify(chunk))
  done()
}

// Create short URL
var store = []
var URLShortner = function() {
  Transform.call(this, { objectMode: true })
}
util.inherits(URLShortner, Transform)

URLShortner.prototype._transform = function(request, encoding, done) {
  var id = store.push(request.u)
  var shortend = { s: "/" + id }
  this.push(shortend)
  done()
}

// Handle requests
var createShortUrl = function(req, res) {
  var bodyParser = new BodyParser()
  var stringify = new ResultStringify()
  var shortner = new URLShortner()
  bodyParser.on("error", function(err) {
    res.statusCode = 500
    res.end("Invalid JSON")
  })
  stringify.on("error", function(err) {
    res.statusCode = 500
    res.end("Internal Server Error")
  })
  shortner.on("error", function(err) {
    res.statusCode = 500
    res.end("Internal Server Error")
  })
  req.pipe(bodyParser)
     .pipe(shortner)
     .pipe(stringify)
     .pipe(res)
}

var router = new Router()
router.addRoute(/^\/$/, "POST", createShortUrl)

var nurl = function(req, res) { router.dispatch(req, res) }

// Setup server if not in test mode
if(process.env.NODE_ENV !== "test") {
  var http = require("http")
  http.createServer(nurl).listen(3000)
}

module.exports = nurl

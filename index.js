/**
 * Router
 * @constructor
 */
var Router = function() {
  /**
   * Store for all routes added using addRoute()
   * @type {{POST: Array, PUT: Array, DELETE: Array, GET: Array}}
   */
  this.routes = {
    'POST': [],
    'PUT': [],
    'DELETE': [],
    'GET': []
  }
}

/**
 * This function adds a route to our route store.
 * When a request matches the regex and the method the
 * callback function `fn` gets executed.
 *
 * @param regex
 * @param method
 * @param fn
 */
Router.prototype.addRoute = function(regex, method, fn) {
  this.routes[method].push({ path: regex, func: fn })
}

/**
 * This function gets executed when any request is made to our application.
 * It iterates over our routes with the given method and matches against
 * the stored regex. When a matching route was found we execute its callback.
 * When there is no matching route, we respond with a 404.
 *
 * @param req
 * @param res
 * @returns {*|func}
 */
Router.prototype.dispatch = function(req, res) {
  var methods = this.routes[req.method]
  for(var i = 0, method = methods[i]; method = methods[i]; i++) {
    if(method.path.test(req.url)) return method.func(req, res)
  }

  res.statusCode = 404
  res.end()
}

var util = require("util")
var Transform = require("stream").Transform

/**
 * The BodyParser basically parses the POST body to JSON.
 * @constructor
 */
var BodyParser = function() {
  Transform.call(this)
  this._body= ""
  this._readableState.objectMode = true;
  this._writableState.objectMode = false;
}
util.inherits(BodyParser, Transform)

/**
 * Get a chunk and it to the _body member.
 * @param chunk
 * @param encoding
 * @param done
 */
BodyParser.prototype._transform = function(chunk, encoding, done) {
  this._body += chunk
  done()
}

/**
 * This function gets called when the transform stream
 * got all the chunks.
 * The function then parses the body string to JSON.
 * If the body doesn't contain valid json an error will be thrown.
 * @param fn
 */
BodyParser.prototype._flush = function(fn) {
  try {
    this.push(JSON.parse(this._body))
  } catch(e) {
    this.emit("error", e)
  }
  fn()
}

/**
 * ResultStringify takes chunks and transforms them to JSON.
 * This is the last step in our application before we send a result.
 * @constructor
 */
var ResultStringify = function() {
  Transform.call(this)
  this._readableState.objectMode = false;
  this._writableState.objectMode = true;
}
util.inherits(ResultStringify, Transform)

/**
 * Transform chunk objects to a json string representation.
 * @param chunk
 * @param encoding
 * @param done
 */
ResultStringify.prototype._transform = function(chunk, encoding, done) {
  this.push(JSON.stringify(chunk))
  done()
}

/**
 * Holds all shortened URLs.
 * The ID of the added URL is always its index + 1 (new length of store)
 * @type {Array}
 */
var store = []

/**
 * This transform stream takes a request, stores the URL in store
 * and pushes the new URI to the next stream.
 * @constructor
 */
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
  // create instances of all streams
  var bodyParser = new BodyParser()
  var stringify = new ResultStringify()
  var shortner = new URLShortner()

  // listen for error events on the bodyParser stream
  bodyParser.on("error", function(err) {
    res.statusCode = 500
    res.end("Invalid JSON")
  })

  // listen for error events on the stringify stream
  stringify.on("error", function(err) {
    res.statusCode = 500
    res.end("Internal Server Error")
  })

  // listen for error events on the shortner stream
  shortner.on("error", function(err) {
    res.statusCode = 500
    res.end("Internal Server Error")
  })

  // kickoff
  // req (request from the client) -> bodyParser -> shortner -> stringify -> res (result to the client)
  req.pipe(bodyParser)
     .pipe(shortner)
     .pipe(stringify)
     .pipe(res)
}

/**
 * Create an instance of the Router Constructor
 * @type {Router}
 */
var router = new Router()

/**
 * Add a route on which we will shorten urls
 */
router.addRoute(/^\/$/, "POST", createShortUrl)

/**
 * This function will be called when there's any request from a client
 * @param req
 * @param res
 */
var nurl = function(req, res) { router.dispatch(req, res) }

// Setup server if not in test mode
if(process.env.NODE_ENV !== "test") {
  var http = require("http")
  http.createServer(nurl).listen(3000)
}

module.exports = nurl

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
  this.routes[req.method].forEach(function(matcher) {
    if(matcher.path.test(req.url))  matcher.func(req, res)
  })
  res.statusCode = 404
  res.end()
}

var createShortUrl = function(req, res) {
  res.end()
}

var router = new Router()
router.addRoute(/^\/$/, 'POST', createShortUrl)


var nurl = function(req, res) { router.dispatch(req, res) }

module.exports = nurl


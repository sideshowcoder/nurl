// SETUP
process.env.NODE_ENV = "test"
process.env.PORT = 9876

// make sure we don't simply crash when an exception happens
// ie a matcher function is not defined, so we can actually debug it
var sys = require('sys')
process.on('uncaughtException',function(e) {
  sys.log("Caught unhandled exception: " + e);
  sys.log(" ---> : " + e.stack);
});

var app = require("../index.js")
var http = require("http")
var request = require("request")

// Automatic testserver setup and shutdown between tests
var server, testUrl
var loadTestServer = function() {
  var hookBeforeEach = function(fn) {
    jasmine.getEnv().currentSuite.beforeEach(fn)
  }

  var hookAfterEach = function(fn) {
    jasmine.getEnv().currentSuite.afterEach(fn)
  }

  hookBeforeEach(function() {
    var running = false
    var port = process.env.PORT

    runs(function() {
      server = http.createServer(app).listen(port, function() {
        testUrl = "http://localhost:" + port
        running = true
      })
    })

    waitsFor(function() { return running })
  })

  hookAfterEach(function() { server.close() })
}

// SPECS
describe("POST '/'", function(){
  loadTestServer()

  it("responds with 200", function(done) {
    var q = { url: testUrl, json: { u: "http://google.com" } }
      request.post(q, function(err, res, body) {
        expect(res.statusCode).toBe(200)
        done()
      })
  })

  it("errors on the wrong url", function(done) {
    var q = { url: testUrl + "/foo/bar", json: { u: "http://google.com" } }
      request.post(q, function(err, res, body) {
        expect(res.statusCode).toBe(404)
        done()
      })
  })

  it("errors on the wrong method", function(done) {
    var q = { url: testUrl, json: { u: "http://google.com" } }
      request.put(q, function(err, res, body) {
        expect(res.statusCode).toBe(404)
        done()
      })
  })

  it("creates a short url", function(done) {
    var q = { url: testUrl, json: { u: "http://google.com" } }
      request.post(q, function(err, res, body) {
        done()
      })
  })

})


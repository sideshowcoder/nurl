// SETUP
process.env.NODE_ENV = "test"
process.env.PORT = 9876

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
    var q = { url: testUrl + "/", json: { u: "http://google.com" } }
    request.put(q, function(err, res, body) {
      expect(res.statusCode).toBe(404)
      done()
    })
  })

})


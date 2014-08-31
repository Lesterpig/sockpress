"use strict";

var assert = require("assert");
var spawn  = require("child_process").spawn;
var request = require("request");
var socketClient = require("socket.io-client");

var __TEST_PORT = 3333;
var __BASE_URL  = "http://localhost:"+__TEST_PORT;

var serverProcess = null;
function startServer(callback) {

	serverProcess = spawn("node", [__dirname + "/scripts/server.js"]);

	serverProcess.stderr.setEncoding("utf8");
	serverProcess.stdout.setEncoding("utf8");

	serverProcess.stdout.on("data", function(m) {
		if(m === "READY") callback();
		else console.log(m);
	});
	serverProcess.stderr.on("data", function(m) {
		throw Error(m);
	});
	serverProcess.on("error", function(err) {
		throw Error(err);
	});
}

describe("Sockpress", function() {

	beforeEach(function(done) {
		if(serverProcess) return done();
		startServer(done);
	});

	after(function(done) {
		serverProcess.kill("SIGKILL");
		done();
	});

	describe("Basic Features", function() {

		it("should start the server", function(done) {
			done();
		});

		it("should be able to get a page", function(done) {
			request(__BASE_URL+"/foo", function(err, res, body) {
				assert.equal(null, err);
				assert.equal("bar", body);
				done();
			});
		});

		it("should be able to get socket.io client", function(done) {
			request(__BASE_URL+"/socket.io/socket.io.js", function(err, res, body) {
				assert.equal(null, err);
				assert.equal(200, res.statusCode);
				done();
			});
		});

		it("should be able to connect to socket.io and emit/receive events", function(done) {
			var _client = socketClient(__BASE_URL);
			_client.on("welcome", function(m) {
				assert.equal("welcome", m);
				done();
			});
			_client.on("error", function(e) {
				throw Error(e);
			});
			_client.on("connect_error", function(e) {
				throw Error(e);
			});
			_client.on("connect_timeout", function() {
				throw Error("Timeout error");
			});
		});

		it("should work with more complex events", function(done) {
			var _client = socketClient(__BASE_URL, {'force new connection': true});
			_client.on("welcome", function() {
				_client.emit("PING", "Hi, I am the client");
			});
			_client.on("PONG", function(m) {
				assert.equal("Hi, I am the server", m);
				done();
			});
		});

	});

	describe("Session Features", function() {

		var j = request.jar();
		request = request.defaults({jar: j}); //enable virtual cookies

		it("should increment a session variable through get", function(done) {
			request(__BASE_URL+"/increment", function(err, res, body) {
				assert.equal(null, err);
				assert.equal(1, body);
				request(__BASE_URL+"/increment", function(err, res, body) {
					assert.equal(null, err);
					assert.equal(2, body);
					request(__BASE_URL+"/increment", function(err, res, body) {
						assert.equal(null, err);
						assert.equal(3, body);
						done();
					});
				});
			});

		});

		//more tests in browser tests.

	});

	describe("IO Routes Features", function() {

		it("should work with one route", function(done) {
			var _client = socketClient(__BASE_URL, {'force new connection': true});
			_client.on("welcome", function() {
				_client.emit("simple route");
				_client.on("simple route ok", done);
			});
		});

		it("should work with another route", function(done) {
			var _client = socketClient(__BASE_URL, {'force new connection': true});
			_client.on("welcome", function() {
				_client.emit("another simple route", "hello");
				_client.on("simple route ok", function() { throw Error("Unexpected ok signal")});
				_client.on("another simple route ok", function(m) {
					if(m.foo !== "bar") throw Error("m.foo !== 'bar'");
					done();
				});
			});
		});

	});

	describe("Browser Tests", function() {
		it("should run into browser", function(done) {
			require("open")(__BASE_URL + "/test.html");
			setTimeout(done, 4000);
		})
	});


});
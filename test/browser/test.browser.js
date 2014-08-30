var __TEST_PORT = 3333;
var __BASE_URL = "http://localhost:" + __TEST_PORT;

describe("Browser Tests", function() {
	it("should start correctly", function() {

	});

	describe("Session Features", function() {

		it("should set a session variable called 'foo'", function(done) {
			var xmlhttp = new XMLHttpRequest();
			xmlhttp.open("GET", __BASE_URL + "/session/foo/bar", true);
			xmlhttp.send();

			xmlhttp.onreadystatechange = function() {
				if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
					done();
				}
			}
		});

		it("should get the session variable called 'foo'", function(done) {
			
			var xmlhttp = new XMLHttpRequest();
			xmlhttp.open("GET", __BASE_URL + "/session/foo", true);
			xmlhttp.send();

			xmlhttp.onreadystatechange = function() {
				if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
					if(xmlhttp.responseText !== "bar") {
						throw Error(xmlhttp.responseText + " !== " + "bar");
					}
					done();
				}
			}
		});

		it("should get this variable via socket.io", function(done) {
			var socket = io(__BASE_URL);
			socket.io._reconnection = false;
			socket.on("welcome", function() {
				socket.emit("get_session", "foo");
				socket.on("session_param", function(m) {
					if(m.param !== "foo") throw Error(m.param + " !== " + "foo");
					if(m.value !== "bar") throw Error(m.value + " !== " + "bar");
					done();
				});
			});
		});

	});
});
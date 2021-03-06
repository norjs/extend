"use strict";

import extend from 'nor-extend';
import assert from 'assert';
import Q from 'q';

function get_names(obj) {
	return Object.getOwnPropertyNames(obj);
}

/* */
describe('extend', function(){

	// extend.getMethodNamesFromConstructor(fun)
	describe('.getMethodNamesFromConstructor()', function(){
		it('should return properties of Array', function(){
			assert.deepEqual( extend.getMethodNamesFromConstructor(Array), get_names(Array.prototype) );
		});
		it('should return properties of String', function(){
			assert.deepEqual( extend.getMethodNamesFromConstructor(String), get_names(String.prototype) );
		});
		it('should return properties of Number', function(){
			assert.deepEqual( extend.getMethodNamesFromConstructor(Number), get_names(Number.prototype) );
		});
		it('should return empty array', function(){
			assert.strictEqual( extend.getMethodNamesFromConstructor().length, 0);
		});
	});

	// extend.getMethodNamesFromObject(obj)
	describe('.getMethodNamesFromObject()', function(){
		it('should return properties of ["foo", "bar"]', function(){
			assert.deepEqual( extend.getMethodNamesFromObject(["foo", "bar"]), get_names(Array.prototype) );
		});
		it('should return properties of "hello"', function(){
			assert.deepEqual( extend.getMethodNamesFromObject("hello"), get_names(String.prototype) );
		});
		it('should return properties of 123', function(){
			assert.deepEqual( extend.getMethodNamesFromObject(123), get_names(Number.prototype) );
		});
		it('should return empty array', function(){
			assert.strictEqual( extend.getMethodNamesFromObject().length, 0);
		});
	});

	// extend.object(self2, methods, obj)
	describe('.object()', function(){
		it('should extend ["hello", "world"] with methods from Foo', function(){
			function Foo() {
			}
			Foo.prototype.foo = function() { return 1; }
			Foo.prototype.bar = function() { return 2; }
			let foo = new Foo();
			let obj = ["hello", "world"];
			let extended_obj = extend.object(foo, extend.getMethodNamesFromObject(foo), obj);
			assert.strictEqual( extended_obj[0], "hello" );
			assert.strictEqual( extended_obj[1], "world" );
			assert.strictEqual( extended_obj.foo(), 1 );
			assert.strictEqual( extended_obj.bar(), 2 );
		});

		it('should extend ["hello", "world"] with methods from Foo (style 2)', function(){
			function Foo() {
			}
			Foo.prototype.foo = function() { return 1; }
			Foo.prototype.bar = function() { return 2; }
			let foo = new Foo();
			let obj = ["hello", "world"];
			let extended_obj = extend.object(foo, Foo, obj);
			assert.strictEqual( extended_obj[0], "hello" );
			assert.strictEqual( extended_obj[1], "world" );
			assert.strictEqual( extended_obj.foo(), 1 );
			assert.strictEqual( extended_obj.bar(), 2 );
		});

		it('should extend ["hello", "world"] with methods from Foo without methods param', function(){
			function Foo() { }
			Foo.prototype.foo = function() { return 1; }
			Foo.prototype.bar = function() { return 2; }
			let foo = new Foo();
			let obj = ["hello", "world"];
			let extended_obj = extend.object(foo, obj);
			assert.strictEqual( extended_obj[0], "hello" );
			assert.strictEqual( extended_obj[1], "world" );
			assert.strictEqual( extended_obj.foo(), 1 );
			assert.strictEqual( extended_obj.bar(), 2 );
		});

		it('should extend ["hello", "world"] with methods from Foo and Bar', function(){
			function Bar() {
			}
			Bar.prototype.bar = function() { return 1; }

			function Foo() {
			}
			Foo.prototype.foo = function() { return 1; }
			let foo = new Foo();
			let obj = ["hello", "world"];
			let extended_obj = extend.object(foo, [Foo, Bar], obj);
			assert.strictEqual( extended_obj[0], "hello" );
			assert.strictEqual( extended_obj[1], "world" );
			assert.strictEqual( extended_obj.foo(), 1 );
			//assert.strictEqual( extended_obj.bar(), 2 );
		});

	});

	// extend.promise(methods, p)
	describe('.promise()', function(){

		it('should extend Q promise with methods from Foobar', function(done){
			function Foobar() {
			}
			Foobar.prototype.foo = function(x) { return x+1; }
			Foobar.prototype.bar = function(x) { return x+2; }

			let defer = Q.defer();
			setTimeout(function() {
				defer.resolve( new Foobar() );
			}, 200);
			let p = defer.promise;

			let methods = extend.getMethodNamesFromConstructor(Foobar);
			let extended_p = extend.promise( methods, p);

			assert.strictEqual( typeof extended_p, 'object' );
			assert.strictEqual( typeof extended_p.foo, 'function' );
			assert.strictEqual( typeof extended_p.bar, 'function' );

			extended_p.foo(1).then(function(x) {
				assert.strictEqual( x, 2 );
				done();
			}).fail(function(err) {
				done(err);
			}).done();
		});

		it('should extend Q promise with methods from Array', function(done){

			let defer = Q.defer();
			setTimeout(function() {
				defer.resolve( ["hello", "world", "foo", "bar"] );
			}, 200);
			let p = defer.promise;

			let methods = extend.getMethodNamesFromConstructor(Array);
			let extended_p = extend.promise( methods, p);

			assert.strictEqual( typeof extended_p, 'object' );
			assert.strictEqual( typeof extended_p.shift, 'function' );

			extended_p.shift().then(function(x) {
				assert.strictEqual( x, "hello" );
				done();
			}).fail(function(err) {
				done(err);
			}).done();
		});


		it('should extend Q promise with methods from Foobar and support method call chaining', function(done){
			function Foobar(x) {
				assert.strictEqual(typeof x, 'number');
				this.x = x;
				assert.strictEqual(typeof this.x, 'number');
				assert.ok(this.x);
			}

			Foobar.prototype.inc = function(x) { 
				assert.strictEqual(typeof this.x, 'number');
				assert.strictEqual(typeof x, 'number');
				this.x += x; 
				assert.ok(this.x);
				return this;
			};

			Foobar.prototype.dec = function(x) {
				assert.strictEqual(typeof this.x, 'number');
				assert.strictEqual(typeof x, 'number');
				this.x -= x; 
				assert.ok(this.x);
				return this;
			};

			Foobar.prototype.get = function() {
				assert.strictEqual(typeof this.x, 'number');
				assert.ok(this.x);
				return this.x;
			};

			let defer = Q.defer();
			setTimeout(function() {
				defer.resolve( new Foobar(1000) );
			}, 200);
			let p = defer.promise;

			let methods = extend.getMethodNamesFromConstructor(Foobar);
			let extended_p = extend.promise( methods, p);

			assert.strictEqual( typeof extended_p, 'object' );
			assert.strictEqual( typeof extended_p.inc, 'function' );
			assert.strictEqual( typeof extended_p.dec, 'function' );
			assert.strictEqual( typeof extended_p.get, 'function' );

			assert.strictEqual( new Foobar(1000).inc(500).dec(750).get(), 1000 + 500 - 750);

			extended_p.inc(500).dec(750).$get().then(function(x) {
				assert.strictEqual( x, 1000 + 500 - 750 );
				done();
			}).fail(function(err) {
				done(err);
			}).done();
		});


		it('should extend Q promise with async methods from Foobar and support method call chaining', function(done){
			function Foobar(x) {
				assert.strictEqual(typeof x, 'number');
				this.x = x;
				assert.strictEqual(typeof this.x, 'number');
				assert.ok(this.x);
			}

			Foobar.create = function(x) {
				let defer = Q.defer();
				setTimeout(function() {
					try {
						defer.resolve( new Foobar(x) );
					} catch(e) {
						defer.reject(e);
					}
				}, 50);
				return defer.promise;
			};

			Foobar.prototype.inc = function(x) {
				let self = this;
				let defer = Q.defer();
				setTimeout(function() {
					try {
						assert.strictEqual(typeof self.x, 'number');
						assert.strictEqual(typeof x, 'number');
						self.x += x; 
						assert.ok(self.x);
						defer.resolve(self);
					} catch(e) {
						defer.reject(e);
					}
				}, 50);
				return defer.promise;
			};

			Foobar.prototype.dec = function(x) {
				let self = this;
				let defer = Q.defer();
				setTimeout(function() {
					try {
						assert.strictEqual(typeof self.x, 'number');
						assert.strictEqual(typeof x, 'number');
						self.x -= x; 
						assert.ok(self.x);
						defer.resolve(self);
					} catch(e) {
						defer.reject(e);
					}
				}, 50);
				return defer.promise;
			};

			Foobar.prototype.get = function() {
				let self = this;
				let defer = Q.defer();
				setTimeout(function() {
					try {
						assert.strictEqual(typeof self.x, 'number');
						assert.ok(self.x);
						defer.resolve(self.x);
					} catch(e) {
						defer.reject(e);
					}
				}, 50);
				return defer.promise;
			};

			let p = Foobar.create(1000);

			let methods = extend.getMethodNamesFromConstructor(Foobar);
			let extended_p = extend.promise( methods, p);

			assert.strictEqual( typeof extended_p, 'object' );
			assert.strictEqual( typeof extended_p.inc, 'function' );
			assert.strictEqual( typeof extended_p.dec, 'function' );
			assert.strictEqual( typeof extended_p.get, 'function' );

			extended_p.inc(500).dec(750).$get().then(function(x) {
				assert.strictEqual( x, 1000 + 500 - 750 );
				done();
			}).fail(function(err) {
				done(err);
			}).done();
		});


		it('should extend Q promise with async methods from Foobar (style 2) and support method call chaining', function(done){
			function Foobar(x) {
				assert.strictEqual(typeof x, 'number');
				this.x = x;
				assert.strictEqual(typeof this.x, 'number');
				assert.ok(this.x);
			}

			Foobar.create = function(x) {
				let defer = Q.defer();
				setTimeout(function() {
					try {
						defer.resolve( new Foobar(x) );
					} catch(e) {
						defer.reject(e);
					}
				}, 50);
				return extend.promise( extend.getMethodNamesFromConstructor(Foobar), defer.promise);
			};

			Foobar.prototype.inc = function(x) {
				let self = this;
				let defer = Q.defer();
				setTimeout(function() {
					try {
						assert.strictEqual(typeof self.x, 'number');
						assert.strictEqual(typeof x, 'number');
						self.x += x; 
						assert.ok(self.x);
						defer.resolve(self);
					} catch(e) {
						defer.reject(e);
					}
				}, 50);
				return extend.promise( extend.getMethodNamesFromConstructor(Foobar), defer.promise);
			};

			Foobar.prototype.dec = function(x) {
				let self = this;
				let defer = Q.defer();
				setTimeout(function() {
					try {
						assert.strictEqual(typeof self.x, 'number');
						assert.strictEqual(typeof x, 'number');
						self.x -= x; 
						assert.ok(self.x);
						defer.resolve(self);
					} catch(e) {
						defer.reject(e);
					}
				}, 50);
				return extend.promise( extend.getMethodNamesFromConstructor(Foobar), defer.promise);
			};

			Foobar.prototype.get = function() {
				let self = this;
				let defer = Q.defer();
				setTimeout(function() {
					try {
						assert.strictEqual(typeof self.x, 'number');
						assert.ok(self.x);
						defer.resolve(self.x);
					} catch(e) {
						defer.reject(e);
					}
				}, 50);
				return extend.promise( extend.getMethodNamesFromConstructor(Foobar), defer.promise);
			};

			let p = Foobar.create(1000);

			assert.strictEqual( typeof p, 'object' );
			assert.strictEqual( typeof p.inc, 'function' );
			assert.strictEqual( typeof p.dec, 'function' );
			assert.strictEqual( typeof p.get, 'function' );

			p.inc(500).then(function(foobar) {
				assert.strictEqual(foobar.x, 1000 + 500);
				return foobar;
			}).dec(750).then(function(foobar) {
				assert.strictEqual(foobar.x, 1000 + 500 - 750);
				return foobar;
			}).$get().then(function(x) {
				assert.strictEqual( x, 1000 + 500 - 750 );
				done();
			}).fail(function(err) {
				done(err);
			}).done();
		});

		it('should extend Q promise with async methods from Foobar and support method call chaining with changing object to Array', function(done){
			function Foobar(x) {
				this.x = x;
			}

			Foobar.create = function(x) {
				let defer = Q.defer();
				setTimeout(function() {
					try {
						defer.resolve( new Foobar(x) );
					} catch(e) {
						defer.reject(e);
					}
				}, 50);
				return extend.promise( [Foobar, Array], defer.promise);
			};

			Foobar.prototype.query = function(x) {
				let self = this;
				let defer = Q.defer();
				setTimeout(function() {
					try {
						assert.strictEqual(typeof x, 'number');
						assert.strictEqual(typeof self.x, 'number');
						assert.ok(self.x);
						defer.resolve( [self.x, x] );
					} catch(e) {
						defer.reject(e);
					}
				}, 50);
				return extend.promise( Array, defer.promise);
			};

			let p = Foobar.create(1000);

			assert.strictEqual( typeof p, 'object' );
			assert.strictEqual( typeof p.$query, 'function' );
			assert.strictEqual( typeof p.$shift, 'function' );

			p.$query(500).$shift().then(function(x) {
				assert.strictEqual(x, 1000);
				done();
			}).fail(function(err) {
				done(err);
			}).done();
		});

	});


	// extend.copy(obj)
	describe('.copy()', function(){
		it('should copy an object', function(){
			let obj = {'foo':'bar'};
			let obj2 = extend.copy(obj);
			assert.strictEqual( obj2.foo, obj.foo );
			obj.foo = 'hello world';
			assert.strictEqual( obj.foo, 'hello world' );
			assert.strictEqual( obj2.foo, 'bar' );
		});
		it('should deep copy an object', function(){
			let obj = {'foo':{'hello':'world'}};
			let obj2 = extend.copy(obj);
			assert.strictEqual( obj2.foo.hello, 'world' );
			obj.foo.hello = 'hello world';
			assert.strictEqual( obj.foo.hello, 'hello world' );
			assert.strictEqual( obj2.foo.hello, 'world' );
		});
	});

});

/* EOF */

/**
 * Route class
 */
function Route() {
  if(!(this instanceof Route)) return new Route();

  this._clientEventHandlers = [];
  this._eventHandlers = [];
  this._middleware = [];
}

Route.prototype.use = function(func) {
  this._middleware.push(func);
  return this;
};

Route.prototype.on = function(event, handler) {
  if (arguments.length < 2) {
    throw new Error('Invalid arguments length');
  }

  this._clientEventHandlers.push({ event: event, handler: handler });
  return this;
};

Route.prototype.event = function(event, handler) {
  // Check arguments
  if (arguments.length < 2) {
    throw new Error('Invalid arguments length');
  }

  // Add route event
  this._eventHandlers.push({ event: event, handler: handler });
  return this;
};

module.exports = Route;

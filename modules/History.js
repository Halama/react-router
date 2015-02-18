var assign = require('react/lib/Object.assign');
var warning = require('react/lib/warning');
var HistoryEvents = require('./HistoryEvents');

function handlePopStateEvent(event) {
  if (event.state === undefined)
    return; // Ignore extraneous popstate events in WebKit.

  this._updateState(state);
  this.notifyChange(HistoryEvents.POP);
}

function History() {
  this.state = window.history.state || {};
  this.length = this.state._length || 1;
  this.current = this.state._current || (this.length - 1);

  this._handlePopStateEvent = handlePopStateEvent.bind(this);

  if (window.addEventListener) {
    window.addEventListener('popstate', this._handlePopStateEvent, false);
  } else {
    window.attachEvent('onpopstate', this._handlePopStateEvent);
  }
}

assign(History.prototype, {

  destruct: function () {
    if (window.addEventListener) {
      window.removeEventListener('popstate', this._handlePopStateEvent, false);
    } else {
      window.removeEvent('onpopstate', this._handlePopStateEvent);
    }

    delete this.current;
    delete this.length;
    delete this.state;
  },

  _updateState: function (state) {
    this.state = assign({}, state, {
      _length: History.length,
      _current: History.current
    });
  },

  pushState: function (state, title, url) {
    this.length += 1;
    this.current += 1;

    this._updateState(state);

    window.history.pushState(this.state, title, url);

    this.notifyChange(HistoryEvents.PUSH);
  },

  replaceState: function (state, title, url) {
    this._updateState(state);

    window.history.replaceState(this.state, title, url);

    this.notifyChange(HistoryEvents.REPLACE);
  },

  back: function () {
    return this.go(-1);
  },

  forward: function () {
    return this.go(1);
  },

  go: function (n) {
    var newCurrent = this.current + n;

    if (newCurrent < 0 || newCurrent >= this.length) {
      warning(
        false,
        'Ignoring History.go(%s) because there is not enough history',
        n
      );

      return false;
    }

    this.current = newCurrent;
    window.history.go(n);

    return true;
  },

  canGoBack: function () {
    return this.canGo(-1);
  },

  canGoForward: function () {
    return this.canGo(1);
  },

  canGo: function (n) {
    var newCurrent = this.current + n;
    return (newCurrent >= 0 || newCurrent < this.length);
  },

  addChangeListener: function (listener) {
    if (!this._changeListeners)
      this._changeListeners = [];

    this._changeListeners.push(listener);
  },

  removeChangeListener: function (listener) {
    if (this._changeListeners) {
      this._changeListeners = this._changeListeners.filter(function (li) {
        return li !== listener;
      });
    }
  },

  notifyChange: function (type) {
    if (this._changeListeners && this._changeListeners.length) {
      var change = {
        type: type
      };

      this._changeListeners.forEach(function (listener) {
        listener(change);
      });
    }
  }

};

module.exports = History;

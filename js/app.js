// Create a super function - odin
(function () {
  'use strict';

  var odin = function (selector) {
    // ensure to use the `new` operator
    if (!(this instanceof odin))
      return new odin(selector);
    this.selector = selector;
    this.elements = document.querySelectorAll(this.selector);
  };

  odin.fn = odin.prototype = {
    init: function () {/*...*/
    }
  };

  // expose the library
  window.odin = odin;
})();

// Libraries:
//---------------------------- Auto complete ---------------------------------------------------------------------------
(function ($) {
  'use strict';

  var objectExtend = function (a, b) {
    if (a == null || b == null) {
      return a;
    }

    Object.keys(b).forEach(function (key) {
      if (Object.prototype.toString.call(b[key]) == '[object Object]') {
        if (Object.prototype.toString.call(a[key]) != '[object Object]') {
          a[key] = b[key];
        } else {
          a[key] = objectExtend(a[key], b[key]);
        }
      } else {
        a[key] = b[key];
      }
    });

    return a;
  };

  $.fn.ac = function (options, items) {
    var _ = this;

    _.options = {
      idListItem: 'xoac',
      cb_after_update_logs: undefined,
      cb_error_set_items: undefined
    };
    _.options = objectExtend(this.options, options);
    _.items = items || [];
    _.selectedItems = [];
    _.searchedKeywords = [];
    _.logs = [];
    _.suggestLayer = null;

    _.init();
    return _;
  };

  $.fn.init = function () {
    var _ = this;


    // Create dom list for items & append to body
    _.renderForFirstTime();

    _.bindEvents();

    return _;
  };

  $.fn.bindEvents = function () {
    var _ = this;
    // Bind event: onkeyup for selector
    for (var i = 0, len = _.elements.length; i < len; i++) {
      _.elements[i].addEventListener("focus", function () {
        _.showSuggestLayer();
      });
      _.elements[i].addEventListener("blur", function () {
        _.hideSuggestLayer();
      });
    }

    // Bind event: for wrapper - event delegation


    // Bind event: arrow key for list items
  };

  $.fn.getItems = function () {

    return _.items;
  };

  $.fn.setItems = function (data) {
    var _ = this;

    // Convert text to json object
    try {
      var items = JSON.parse(data);
    } catch(e) {
      typeof _.options.cb_error_set_items === 'function' && _.options.cb_error_set_items(e, _);
    }

    // Validate format of items variable before updating
    _.items = items;

    // If data is valid
    // --> clear all history
    _.clearHistory();
    // --> re-render dom
    _.render();

    return _;
  };

  $.fn.renderForFirstTime = function () {
    var _ = this;
    var container = document.createElement("div");
    container.className = 'oac box-shadow';
    var ul = document.createElement("ul");
    ul.className = 'oac__list';
    ul.setAttribute('id', _.options.idListItem);

    for (var i = 0, len = _.items.length; i < len; i++) {

      var li = document.createElement("li");
      li.className = 'oac__item';
      li.setAttribute('data-index', i);
      var divImg = document.createElement("div");
      divImg.className = 'oac__img';
      var divName = document.createElement("div");
      divName.className = 'oac__name';
      divName.innerHTML = _.items[i].name;

      li.appendChild(divImg);
      li.appendChild(divName);
      li.appendChild(divName);
      ul.appendChild(li);
    }

    container.appendChild(ul);

    for (var i = 0, len = _.elements.length; i < len; i++) {
      _.elements[i].parentNode.insertBefore(container, _.elements[i].nextSibling);
    }

    _.suggestLayer = container;

  };

  $.fn.render = function () {
    var _ = this;
    // Virtual dom

    return _;
  };

  $.fn.addSelectedItem = function (item) {
    this.selectedItems.push(item)

    return this;
  };

  $.fn.getSeletedItems = function () {

    return this.selectedItems;
  };

  $.fn.addSearchedKeyword = function (keyword) {
    this.searchedKeywords.push(keyword)

    return this;
  };

  $.fn.getSearchedKeywords = function () {

    return this.searchedKeywords;
  };

  $.fn.clearHistory = function () {
    var _ = this;

    _.searchedKeywords = [];
    _.selectedItems = [];

    return _;
  };

  $.fn.addLogs = function (log) {
    this.logs.push(log);

    // Run callback: after_set_logs
    typeof _.options.cb_after_update_logs === 'function' && _.options.cb_after_update_logs(_.logs, _);
  };

  $.fn.getLogs = function () {

    return this.logs;
  };

  $.fn.setLogs = function (newLogs) {
    var _ = this;
    _.logs = JSON.parse(JSON.stringify(newLogs));

    // Run callback: after_set_logs
    typeof _.options.cb_after_update_logs === 'function' && _.options.cb_after_update_logs(_.logs, _);

    return _;
  };

  $.fn.clearLogs = function () {
    var _ = this;
    _.setLogs([]);
    return _;
  };

  $.fn.showSuggestLayer = function () {
    var arr = this.suggestLayer.className.split(" ");
    if (arr.indexOf('active') < 0) {
      this.suggestLayer.className += ' active';
    }
  };

  $.fn.hideSuggestLayer = function () {
    this.suggestLayer.className = this.suggestLayer.className.replace(/\active\b/g, "");
    this.suggestLayer.className = this.suggestLayer.className.trim();
  };

})(odin);


var aaa = odin('.i_search').ac({fap: 1}, TABLE_DATA);
console.log(aaa);

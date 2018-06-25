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

  if (!Date.now) {
    Date.now = function() { return new Date().getTime(); }
  }

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

  var guid = function () {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }
    return 'x' + s4() + s4() + '-' + s4()
  };

  var createDomLi = function (item, index, wrapperId) {

    var li = document.createElement("li");
    li.className = 'oac__item';
    li.setAttribute('data-wrapper-id', wrapperId);
    li.setAttribute('data-index', index);
    var divImg = document.createElement("div");
    divImg.className = 'oac__img';
    divImg.setAttribute('data-index', index);
    divImg.setAttribute('data-wrapper-id', wrapperId);
    var img = document.createElement("img");
    img.setAttribute('src', item.thumbnailUrl);
    var divName = document.createElement("div");
    divName.className = 'oac__name';
    divName.setAttribute('data-index', index);
    divName.innerHTML = item.name;
    divName.setAttribute('data-wrapper-id', wrapperId);

    divImg.appendChild(img);
    li.appendChild(divImg);
    li.appendChild(divName);
    li.appendChild(divName);

    return li;
  };

  $.fn.ac = function (options, items) {
    var _ = this;

    _.options = {
      cb_after_update_logs: undefined,
      cb_error_set_items: undefined
    };
    _.options = objectExtend(this.options, options);
    _.originalItems = items || [];
    _.selectedItems = [];
    _.searchedKeywords = [];
    _.logs = [];
    _.suggestLayer = null;
    _.timeoutKeyup = null;
    _.superElements = [];
    _.superElementsObj = {};

    _.init();
    return _;
  };

  $.fn.init = function () {
    var _ = this;

    // Init elements
    for (var i = 0, len = _.elements.length; i < len; i++) {
      var elmData = {
        idWrapper: guid(),
        idListItem: guid(),
        dom: _.elements[i],
        suggestLayer: null,
        timeoutKeyup: null,
        items: _.originalItems,
        selectedItem: null
      };

      _.superElements.push(elmData);
      _.superElementsObj[elmData.idWrapper] = elmData;
    }

    // Create dom list for items
    _.renderForFirstTime();

    _.bindEvents();

    return _;
  };

  $.fn.bindEvents = function () {
    var _ = this;
    // Bind event: onkeyup for selector
    for (var i = 0, len = _.superElements.length; i < len; i++) {
      var se = _.superElements[i];
      se.dom.addEventListener("focus", function () {
        _.showSuggestLayer(this.getAttribute('data-wrapper-id'));
      });
      se.dom.addEventListener("blur", function () {
        var wrapperId = this.getAttribute('data-wrapper-id');
        setTimeout(function () {
          _.hideSuggestLayer(wrapperId);
        }, 100)
      });
      se.dom.addEventListener("keyup", function () {
        var wrapperId = this.getAttribute('data-wrapper-id');
        var keyword = this.value;
        clearTimeout(_.timeoutKeyup);
        _.timeoutKeyup = setTimeout(function () {
          _.query(keyword, wrapperId);
        }, 400);
      });

      // Bind event: for wrapper - event delegation
      document.getElementById(se.idListItem).addEventListener("click", function (e) {
        // e.target was the clicked element
        var wrapperId = e.target.getAttribute('data-wrapper-id');
        var index = e.target.getAttribute('data-index');

        _.selectItem(wrapperId, index);
      });
    }

    // Bind event: arrow key for list items
  };

  $.fn.query = function (keyword, wrapperId) {
    var _ = this;
    var newItems = [];

    var startTime = Date.now();

    for (var i = 0, len = _.originalItems.length; i < len; i++) {
      if (-1 < _.originalItems[i].name.toLowerCase().indexOf(keyword.toLowerCase())) {
        newItems.push(_.originalItems[i])
      }
    }

    _.setItems(newItems, wrapperId);

    var endTime = Date.now();

    _.addLog({
      keyword: keyword,
      start_time: startTime,
      end_time: endTime,
      execution_time: endTime - startTime
    })
  };

  $.fn.selectItem = function (wrapperId, index) {
    this.superElementsObj[wrapperId].selectedItem = this.superElementsObj[wrapperId].items[index];
    this.superElementsObj[wrapperId].dom.value = this.superElementsObj[wrapperId].selectedItem.name;
  };

  $.fn.getItems = function () {

    return this.items;
  };

  $.fn.setItems = function (items, wrapperId) {
    var _ = this;

    // Convert text to json object
    // try {
    //   var items = JSON.parse(data);
    // } catch (e) {
    //   typeof _.options.cb_error_set_items === 'function' && _.options.cb_error_set_items(e, _);
    // }

    _.superElementsObj[wrapperId].items = items;

    // --> re-render dom
    _.render(wrapperId);

    return _;
  };

  $.fn.renderForFirstTime = function () {
    var _ = this;

    for (var i = 0, len = _.superElements.length; i < len; i++) {
      var se = _.superElements[i];

      var container = document.createElement("div");
      container.className = 'oac box-shadow';
      container.setAttribute('id', se.idWrapper);
      var ul = document.createElement("ul");
      ul.className = 'oac__list';
      ul.setAttribute('id', se.idListItem);
      ul.setAttribute('data-wrapper-id', se.idWrapper);

      for (var j = 0, len1 = _.originalItems.length; j < len1; j++) {
        var li = createDomLi(_.originalItems[j], j, se.idWrapper)
        ul.appendChild(li);
      }

      container.appendChild(ul);
      var emlContainer = container.cloneNode(true);

      se.dom.parentNode.insertBefore(emlContainer, se.dom.nextSibling);
      _.superElements[i].suggestLayer = emlContainer;
      se.dom.setAttribute('data-list-id', se.idListItem);
      se.dom.setAttribute('data-wrapper-id', se.idWrapper);

      if (!se.dom.getAttribute('id')) {
        se.dom.setAttribute(guid());
      }
    }

  };

  $.fn.render = function (wrapperId) {
    var _ = this;
    console.log(wrapperId);

    console.log(_.superElementsObj[wrapperId].items);
    var ul = document.querySelector('#' + _.superElementsObj[wrapperId].idListItem);
    console.log(ul);
    ul.innerHTML = '';
    for (var j = 0, len1 = _.superElementsObj[wrapperId].items.length; j < len1; j++) {
      var li = createDomLi(_.superElementsObj[wrapperId].items[j], j, wrapperId)
      ul.appendChild(li);
    }

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

  $.fn.addLog = function (log) {
    var _ = this;
    _.logs.push(log);

    // Run callback: after_set_logs
    typeof _.options.cb_after_update_logs === 'function' && _.options.cb_after_update_logs(log, _);

    return _;
  };

  $.fn.getLogs = function () {

    return this.logs;
  };

  $.fn.setLogs = function (newLogs) {
    var _ = this;
    _.logs = JSON.parse(JSON.stringify(newLogs));

    // Run callback: after_set_logs
    typeof _.options.cb_after_update_logs === 'function' && _.options.cb_after_update_logs(null, _);

    return _;
  };

  $.fn.clearLogs = function () {
    var _ = this;
    _.setLogs([]);
    return _;
  };

  $.fn.showSuggestLayer = function (wrapperId) {
    var _ = this;
    var arr = _.superElementsObj[wrapperId].suggestLayer.className.split(" ");
    if (arr.indexOf('active') < 0) {
      _.superElementsObj[wrapperId].suggestLayer.className += ' active';
    }
  };

  $.fn.hideSuggestLayer = function (wrapperId) {
    var _ = this;
    _.superElementsObj[wrapperId].suggestLayer.className = _.superElementsObj[wrapperId].suggestLayer.className.replace(/\active\b/g, "");
    _.superElementsObj[wrapperId].suggestLayer.className = _.superElementsObj[wrapperId].suggestLayer.className.trim();
  };

})(odin);

var _thor = {
  createDomLog: function (log, index) {
    var li = document.createElement("li");
    li.className = 'logs__item';
    var divKeyword = document.createElement("div");
    divKeyword.className = 'logs__keyword';
    divKeyword.innerHTML = index + '. ' + log.keyword;
    var divDetail = document.createElement("div");
    divDetail.className = 'row logs__detail';

    var divStart = document.createElement("div");
    divStart.className = 'col-sm-4 col-md-4';
    divStart.innerHTML = 'Start time: ' + log.start_time;
    var divEnd = document.createElement("div");
    divEnd.className = 'col-sm-4 col-md-4';
    divEnd.innerHTML = 'End time: ' + log.end_time;
    var divExe = document.createElement("div");
    divExe.className = 'col-sm-4 col-md-4';
    divExe.innerHTML = 'Execution time: ' + log.execution_time + 'ms';

    divDetail.appendChild(divStart);
    divDetail.appendChild(divEnd);
    divDetail.appendChild(divExe);
    li.appendChild(divKeyword);
    li.appendChild(divDetail);
    return li;
  }
};


// Start ----> FAP
var loki = odin('.i_search').ac({
  cb_after_update_logs: function (log, sOdin) {
    var logContainer = document.getElementById('main_logs');
    if (log && sOdin.logs.length) {
      logContainer.prepend(_thor.createDomLog(log, sOdin.logs.length));
    } else {
      logContainer.innerHTML = '';
    }

  }
}, TABLE_DATA);

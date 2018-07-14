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

  function h(type, props, ...children) {
    return { type, props, children };
  }

  function createElement(node) {
    if (typeof node === 'string') {
      return document.createTextNode(node);
    }
    const $el = document.createElement(node.type);
    node.children
      .map(createElement)
      .forEach($el.appendChild.bind($el));
    return $el;
  }

  function changed(node1, node2) {
    return typeof node1 !== typeof node2 ||
      typeof node1 === 'string' && node1 !== node2 ||
      node1.type !== node2.type
  }

  function updateElement($parent, newNode, oldNode, index = 0) {
    if (!oldNode) {
      $parent.appendChild(
        createElement(newNode)
      );
    } else if (!newNode) {
      $parent.removeChild(
        $parent.childNodes[index]
      );
    } else if (changed(newNode, oldNode)) {
      $parent.replaceChild(
        createElement(newNode),
        $parent.childNodes[index]
      );
    } else if (newNode.type) {
      const newLength = newNode.children.length;
      const oldLength = oldNode.children.length;
      for (let i = 0; i < newLength || i < oldLength; i++) {
        updateElement(
          $parent.childNodes[index],
          newNode.children[i],
          oldNode.children[i],
          i
        );
      }
    }
  }

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

  var updateDomLi = function (liDom, newItem) {
    liDom.childNodes[0].childNodes[0].setAttribute('src', newItem.thumbnailUrl);
    liDom.childNodes[1].innerHTML = newItem.name;
  };

  var createHtmlFromItems = function(items, wrapperId, idList) {
    var html = '';
    var ul = {
      type: 'ul',
      props: {
        className: 'logs',
        id: idList
      },
      children: []
    };
    for (var i = 0, len = items.length; i < len; i++) {
      var item = items[i];
      // ul.children.push({
      //   type: 'li',
      //   props: {
      //     className: 'oac__item'
      //   },
      //   children: [
      //     {
      //       type: 'div',
      //       props: {
      //         className: 'oac__img',
      //         'data-index': i,
      //         'data-wrapper-id': wrapperId
      //       },
      //       children: [
      //         {
      //           type: 'img',
      //           props: {
      //             src: item.thumbnailUrl
      //           },
      //           children: []
      //         }
      //       ]
      //     },
      //     {
      //       type: 'div',
      //       props: {
      //         className: 'oac__name',
      //         'data-index': i,
      //         'data-wrapper-id': wrapperId
      //       },
      //       children: [
      //         item.name
      //       ]
      //     }
      //   ]
      // });

      html += '<li class="oac__item">'
        + '<div class="oac__img" data-index="' + i + '" data-wrapper-id="' + wrapperId + '">'
        + '<img src="' + item.thumbnailUrl + '">'
        + '</div>'
        + '<div class="oac__name" data-index="' + i + '" data-wrapper-id="' + wrapperId + '">'
        + item.name
        + '</div>'
        + '</li>';
    }



    return html;
  };

  $.fn.ac = function (options, items) {
    var _ = this;


    for (var i = 0, len = items.length; i < len; i++) {
      items[i].originalIndex = i;
    }
    _.options = {
      cb_after_update_logs: undefined,
      cb_error_set_items: undefined,
      use_virtual_dom: true
    };
    _.options = objectExtend(this.options, options);
    _.originalItems = items || [];
    _.originalItemsObj = {};
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
        oldItems: [],
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

    _.superElementsObj[wrapperId].oldItems = _.superElementsObj[wrapperId].items;
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
    var ul = document.querySelector('#' + _.superElementsObj[wrapperId].idListItem);

    if (_.options.use_virtual_dom) {
      // updateElement(ul, createHtmlFromItems(_.superElementsObj[wrapperId].items, wrapperId, _.superElementsObj[wrapperId].idListItem), createHtmlFromItems(_.superElementsObj[wrapperId].oldItems, wrapperId, _.superElementsObj[wrapperId].idListItem));

      var newItems = _.superElementsObj[wrapperId].items;
      var oldItems = _.superElementsObj[wrapperId].oldItems;
      var newLength = newItems.length;
      var oldLength= oldItems.length;


      while (ul.firstChild) {
        ul.removeChild(ul.firstChild);
      }
      var fragment = document.createDocumentFragment();
      for (var i = 0; i < newLength; i++) {
        fragment.appendChild(createDomLi(newItems[i], i, wrapperId))
      }
      ul.appendChild(fragment);
      return;



      if (newLength === 0) {
        ul.innerHTML = '';
        while (ul.firstChild) {
          ul.removeChild(ul.firstChild);
        }
      } else if (oldLength === 0) {
        var fragment = document.createDocumentFragment();
        for (var i = 0; i <newLength; i++) {
          fragment.appendChild(createDomLi(newItems[i], i, wrapperId))
        }
        ul.appendChild(fragment);
      } else if (oldLength === newLength) {
        for (var i = 0; i <newLength; i++) {
          updateDomLi(ul.childNodes[i], newItems[i]);
        }
      } else if (oldLength < newLength) {
        var fragment = document.createDocumentFragment();
        for (var i = 0; i < newLength; i++) {
          if (oldItems[i]) {
            if (newItems[i] !== oldItems[i]) {
              updateDomLi(ul.childNodes[i], newItems[i]);
            }
          } else {
            fragment.appendChild(createDomLi(newItems[i], i, wrapperId))
          }
        }
        ul.appendChild(fragment);
      } else if (newLength < oldLength) {
        for (var i = oldLength - 1; 0 <= i; i--) {
          if (newItems[i]) {
            if (newItems[i] !== oldItems[i]) {
              updateDomLi(ul.childNodes[i], newItems[i]);
            }
          } else {
            ul.removeChild(ul.childNodes[i]);
          }
        }
      }
      // for (var i = max - 1; 0 <= i; i--) {
        // if (!oldItems[i]) {
        //   ul.appendChild(
        //     createDomLi(newItems[i], i, wrapperId)
        //   );
        // } else if (!newItems[i]) {
        //   console.log(i)
        //   if (i === 280) {
        //     debugger
        //   }
        //   ul.removeChild(
        //     ul.childNodes[i]
        //   );
        // } else if (JSON.stringify(newItems[i]) !== JSON.stringify(oldItems[i])) {
        //   ul.replaceChild(
        //     createDomLi(newItems[i], i, wrapperId),
        //     ul.childNodes[i]
        //   );
        // }

      //   if (!newItems[i]) {
      //     ul.removeChild(ul.childNodes[i]);
      //   } else if (JSON.stringify(newItems[i]) !== JSON.stringify(oldItems[i])) {
      //     updateDomLi(ul.childNodes[i], newItems[i]);
      //   }
      //
      // }


    } else {

      // ul.innerHTML = '';--
      ul.innerHTML = createHtmlFromItems(_.superElementsObj[wrapperId].items);
      // for (var j = 0, len1 = _.superElementsObj[wrapperId].items.length; j < len1; j++) {
      //   var li = createDomLi(_.superElementsObj[wrapperId].items[j], j, wrapperId);
      //   ul.appendChild(li);
      // }
    }

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
    divStart.className = 'col-sm-6 col-md-3';
    divStart.innerHTML = 'Start time: ' + log.start_time;
    var divEnd = document.createElement("div");
    divEnd.className = 'col-sm-6 col-md-3';
    divEnd.innerHTML = 'End time: ' + log.end_time;
    var divExe = document.createElement("div");
    divExe.className = 'col-sm-6 col-md-3';
    divExe.innerHTML = 'Execution time: ' + log.execution_time + 'ms';
    var divDom = document.createElement("div");
    if (loki.options.use_virtual_dom) {
      divDom.className = 'col-sm-6 col-md-3 v-dom';
      divDom.innerHTML = 'Virtual Dom';
    } else {
      divDom.className = 'col-sm-6 col-md-3 r-dom';
      divDom.innerHTML = 'Real Dom';
    }

    divDetail.appendChild(divStart);
    divDetail.appendChild(divEnd);
    divDetail.appendChild(divExe);
    divDetail.appendChild(divDom);
    li.appendChild(divKeyword);
    li.appendChild(divDetail);
    return li;
  },

  clearLogs: function () {
    loki.clearLogs();
  },

  toggleVirtualDom: function () {
    loki.options.use_virtual_dom = !loki.options.use_virtual_dom;
    if (loki.options.use_virtual_dom) {
      document.getElementById('v-dom-stt').innerText = 'using virtual dom';
    } else {
      document.getElementById('v-dom-stt').innerText = 'using real dom'
    }

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

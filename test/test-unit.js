/* jshint maxlen:100 */
/*global sinon, assert, suite, setup, teardown, test, UIEvent */
suite('GaiaHeader', function() {
  'use strict';

  var afterNext = window['test-utils'].afterNext;
  var GaiaHeader = window['gaia-header'];
  var accessibility = window['test-utils'].accessibility;

  var windowWidth = 500;

  setup(function() {
    this.sinon = sinon.sandbox.create();

    // Spy/stub FontFit
    this.sinon.spy(GaiaHeader.prototype, 'fontFit');
    this.fontFit = GaiaHeader.prototype.fontFit; // alias

    this.sinon.spy(HTMLElement.prototype, 'addEventListener');
    this.sinon.spy(GaiaHeader.prototype, 'setTitleStyle');
    this.sinon.spy(GaiaHeader.prototype, 'runFontFit');
    this.runFontFit = GaiaHeader.prototype.runFontFit;

    // DOM container to put test cases
    this.dom = document.createElement('div');
    this.dom.style.width = windowWidth + 'px';
    document.body.appendChild(this.dom);

    // Overwrite `window.innerWidth` so we know
    // it's the same no matter the size of the
    // browser window across test environments.
    this.innerWidth = Object.getOwnPropertyDescriptor(window, 'innerWidth');
    this.innerWidth_spy = this.sinon.spy(() => windowWidth);
    Object.defineProperty(window, 'innerWidth', {
      get: this.innerWidth_spy
    });
  });

  teardown(function() {
    this.sinon.restore();
    this.dom.remove();
    Object.defineProperty(window, 'innerWidth', this.innerWidth);
  });

  test('It hides the action button if no action type defined', function() {
    this.dom.innerHTML = '<gaia-header></gaia-header>';
    var el = this.dom.firstElementChild;
    var actionButton = el.shadowRoot.querySelector('.action-button');
    assert.equal(getComputedStyle(actionButton).display, 'none');
  });

  test('It doesn\'t show an action button for unsupported action types',
    function() {
    this.dom.innerHTML = '<gaia-header action="unsupported"></gaia-header>';
    var el = this.dom.firstElementChild;
    var actionButton = el.shadowRoot.querySelector('.action-button');
    assert.equal(getComputedStyle(actionButton).display, 'none');
  });

  test('It adds the correct icon for the action type', function() {
    ['menu', 'close'].forEach(function(type) {
      this.dom.innerHTML = '<gaia-header action="' + type + '"></gaia-header>';
      var el = this.dom.firstElementChild;
      var actionButton = el.shadowRoot.querySelector('.action-button');
      var icon = getComputedStyle(actionButton, ':before').content.replace(/"/g, '');
      var fontFamily = getComputedStyle(actionButton, ':before').fontFamily.replace(/"/g, '');
      assert.equal(icon, type);
      assert.equal(fontFamily, 'gaia-icons');
      assert.notEqual(getComputedStyle(actionButton).display, 'none');
    }, this);
  });

  test('It adds the correct icon for the back action', function() {
    // LTR: back action translates to left arrow.
    // RTL: back action translates to right arrow.
    [{dir: 'ltr', icon: 'left'}, {dir: 'rtl', icon: 'right'}].forEach(function(spec) {
      this.dom.innerHTML = '<gaia-header dir="' + spec.dir + '" action="back"></gaia-header>';
      var el = this.dom.firstElementChild;
      var actionButton = el.shadowRoot.querySelector('.action-button');
      var icon = getComputedStyle(actionButton, ':before').content.replace(/"/g, '');
      var fontFamily = getComputedStyle(actionButton, ':before').fontFamily.replace(/"/g, '');
      assert.equal(icon, spec.icon);
      assert.equal(fontFamily, 'gaia-icons');
      assert.notEqual(getComputedStyle(actionButton).display, 'none');
    }, this);
  });

  test('It catches changes to the `action` attribute', function() {
    this.dom.innerHTML = '<gaia-header action="back"><h1></h1></gaia-header>';
    var element = this.dom.firstElementChild;
    var actionButton = element.shadowRoot.querySelector('.action-button');
    var icon = getComputedStyle(actionButton, ':before').content.replace(/"/g, '');

    assert.equal(icon, 'left');

    /* change to another supported action */
    element.setAttribute('action', 'close');
    icon = getComputedStyle(actionButton, ':before').content.replace(/"/g, '');
    assert.equal(icon, 'close', 'has correct icon');
    assert.ok(actionButton.clientWidth > 0, 'action-button displayed');

    /* change to an unsupported action */
    element.setAttribute('action', 'unsupported');
    icon = getComputedStyle(actionButton, ':before').content.replace(/"/g, '');
    assert.equal(icon, 'none', 'has no icon');
    assert.equal(actionButton.clientWidth, 0, 'action button is hidden');

    /* back to something supported */
    element.setAttribute('action', 'menu');
    icon = getComputedStyle(actionButton, ':before').content.replace(/"/g, '');
    assert.equal(icon, 'menu', 'has correct icons');
    assert.ok(actionButton.clientWidth > 0, 'action-button displayed');
  });

  test('It allows setting via `.action`', function() {
    this.dom.innerHTML = '<gaia-header action="back"><h1></h1></gaia-header>';
    var el = this.dom.firstElementChild;
    var actionButton = el.shadowRoot.querySelector('.action-button');
    var icon = getComputedStyle(actionButton, ':before').content.replace(/"/g, '');

    assert.equal(icon, 'left', 'has correct icon');

    el.action = 'menu';
    icon = getComputedStyle(actionButton, ':before').content.replace(/"/g, '');
    assert.equal(icon, 'menu', 'has correct icon');
  });

  test('It allows getting via `.action`', function() {
    this.dom.innerHTML = '<gaia-header action="back"><h1></h1></gaia-header>';
    var el = this.dom.firstElementChild;
    assert.equal(el.action, 'back');
  });

  suite('font-fit', function() {
    test('It sets up font-fit when attached', function(done) {
      var div = document.createElement('div');
      div.innerHTML = '<gaia-header action="back"><h1>Title</h1></gaia-header>';
      var el = div.firstElementChild;

      afterNext(el, 'runFontFit').catch(() => {
        sinon.assert.notCalled(this.fontFit);
        this.dom.appendChild(el);
        return afterNext(el, 'runFontFit');
      }).then(() => {
        sinon.assert.called(this.fontFit);
      }).then(done, done);
    });

    test('It doesn\'t throw when there is no header', function() {
      GaiaHeader();
    });

    test('It shouldn\'t run if there is no title `textContent` (ie. before l10n)',
      function(done) {
      this.dom.innerHTML = '<gaia-header action="back"><h1></h1></gaia-header>';

      var el = this.dom.firstElementChild;
      var h1 = el.querySelector('h1');

      afterNext(el, 'runFontFit').then(() => {
        assert.equal(h1.style.fontSize, '',
          'font-size should not have been set');
        assert.equal(h1.style.marginInlineStart, '',
          'margin should not have been set');

        h1.textContent = 'Localized title';
        return afterNext(el, 'runFontFit');
      }).then(() => {
        sinon.assert.calledOnce(this.fontFit);
        assert.equal(h1.style.fontSize, '23px', 'font-size has been set');
        assert.equal(h1.style.marginInlineStart, '-50px', 'margin has been set');
      }).then(done, done);
    });

    test('It doesn\'t run if there are only spaces in title', function(done) {
      this.dom.innerHTML = '<gaia-header action="back"><h1>   </h1></gaia-header>';

      var el = this.dom.firstElementChild;
      var h1 = el.querySelector('h1');

      afterNext(el, 'runFontFit').then(() => {
        assert.equal(h1.style.fontSize, '',
          'font-size should not have been set');
        assert.equal(h1.style.marginInlineStart, '',
          'margin should not have been set');
        sinon.assert.notCalled(this.fontFit);
      }).then(done, done);
    });

    test('It doesn\'t run font-fit when title-space or textContent haven\'t changed',
      function(done) {
      this.dom.innerHTML =
        '<gaia-header action="back"><h1>Title</h1></gaia-header>';

      var el = this.dom.firstElementChild;
      var h1 = el.querySelector('h1');

      afterNext(el, 'runFontFit').then(() => {
        assert.equal(h1.style.fontSize, '23px');
        assert.equal(h1.style.marginInlineStart, '-50px');

        h1.textContent = 'Title';
        h1.setAttribute('foo', 'bar');
        this.fontFit.reset();

        return afterNext(el, 'runFontFit');
      }).then(() => {
        sinon.assert.notCalled(this.fontFit);
      }).then(done, done);
    });

    test('It should not run when attached if the `no-font-fit` attribute is present',
      function(done) {
      this.dom.innerHTML = `
        <gaia-header action="back" no-font-fit>
        <h1>Header title</h1>
      </gaia-header>`;

      var el = this.dom.firstElementChild;

      afterNext(el, 'runFontFit').then(() => {
        sinon.assert.notCalled(this.fontFit);
      }).then(done, done);
    });

    test('It works when we change `textContent` right after font-fit has been called',
      function(done) {
      this.dom.innerHTML = `<gaia-header action="back">
        <h1>short</h1></gaia-header>`;

      var el = this.dom.firstElementChild;
      var h1 = el.querySelector('h1');

      h1.textContent = 'long long long long long long long long long long long long long long';

      afterNext(el, 'runFontFit').then(() => {
        assert.equal(h1.style.fontSize, '16px');

        // Calls from mutations are debounced as well
        sinon.assert.calledOnce(el.runFontFit);

        h1.textContent = 'short';

        return afterNext(el, 'runFontFit');
      }).then(() => {
        assert.equal(h1.style.fontSize, '23px');
      }).then(done, done);
    });

    test('It works when we add the title after creating the element', function() {
      var header = document.createElement('gaia-header');
      var h1 = document.createElement('h1');
      h1.textContent = 'something important';
      header.setAttribute('action', 'back');
      header.appendChild(h1);
      this.dom.appendChild(header);

      return afterNext(header, 'runFontFit').then(() => {
        assert.equal(h1.style.marginInlineStart, '-50px');
      });
    });

    test('It works when we add buttons after creating the element', function() {
      var header = document.createElement('gaia-header');
      var h1 = document.createElement('h1');
      h1.textContent = 'something important';
      var button = document.createElement('button');
      button.style.width = '50px';

      header.appendChild(h1);
      header.appendChild(button);
      this.dom.appendChild(header);

      return afterNext(header, 'runFontFit').then(() => {
        assert.equal(h1.style.marginInlineStart, '50px');
      });
    });

    test('It\'s debounced', function(done) {
      this.dom.innerHTML = `<gaia-header action="back">
        <h1>Title</h1>
      </gaia-header>`;

      var el = this.dom.firstElementChild;

      el.runFontFit();
      el.runFontFit();
      el.runFontFit();

      el.runFontFit().then(() => {
        sinon.assert.calledOnce(el.setTitleStyle);
      }).then(done, done);
    });

    test('It always runs when mutation occurs', function(done) {
      this.dom.innerHTML = `<gaia-header action="back">
        <h1>Title</h1>
      </gaia-header>`;

      var el = this.dom.firstElementChild;
      var h1 = el.querySelector('h1');

      h1.textContent = 'long long long long long long long long long long long long long long';

      afterNext(el, 'runFontFit').then(() => {
        return el.runFontFit();
      }).then(() => {
        sinon.assert.calledOnce(el.setTitleStyle);
        assert.equal(h1.style.fontSize, '16px');
      }).then(done, done);
    });

    test('fontFit is run again when the window is resized', function() {
      this.dom.innerHTML = '<gaia-header action="back"><h1>Title</h1></gaia-header>';
      var header = this.dom.firstElementChild;

      return afterNext(header, 'runFontFit').then(() => {
        this.fontFit.reset();
        // make requestAnimationFrame async
        this.sinon.stub(window, 'requestAnimationFrame').returns(1);

        windowWidth = 600;
        var resizeEvent = new UIEvent('resize');
        window.dispatchEvent(resizeEvent);
        window.requestAnimationFrame.yield();

        return afterNext(header, 'runFontFit');
      }).then(() => {
        sinon.assert.calledOnce(this.fontFit);
        this.fontFit.reset();

        var resizeEvent = new UIEvent('resize');
        window.dispatchEvent(resizeEvent);
        window.requestAnimationFrame.yield();
        return afterNext(header, 'runFontFit');
      }).then(() => {
        sinon.assert.notCalled(this.fontFit,
          'fontFit is not called if the width does not change');

        window.requestAnimationFrame.reset();
        header.runFontFit.reset();

        this.dom.innerHTML = '';
        windowWidth = 700;
        var resizeEvent = new UIEvent('resize');
        window.dispatchEvent(resizeEvent);
        sinon.assert.notCalled(window.requestAnimationFrame,
          'nothing is run when header is detached');
        sinon.assert.notCalled(header.runFontFit,
          'fontFit is not called when header is detached');
      });
    });

    test('fontFit is run when window is resized and we use not-flush', function() {
      this.dom.innerHTML = '<gaia-header not-flush action="back"><h1>Title</h1></gaia-header>';
      var header = this.dom.firstElementChild;

      return afterNext(header, 'runFontFit').then(() => {
        this.runFontFit.reset();
        this.sinon.stub(window, 'requestAnimationFrame').returns(1);

        windowWidth = 600;
        var resizeEvent = new UIEvent('resize');
        window.dispatchEvent(resizeEvent);

        window.requestAnimationFrame.yield();
        return afterNext(header, 'runFontFit');
      }).then(() => {
        sinon.assert.calledOnce(this.fontFit);
      });
    });
  });

  suite('Mutation observer', function() {
    test('It runs font-fit and centering when the title changes', function(done) {
      this.dom.innerHTML = '<gaia-header action="back"><h1>foo</h1></gaia-header>';

      var el = this.dom.firstElementChild;
      var h1 = el.querySelector('h1');

      afterNext(el, 'runFontFit').then(() => {
        this.fontFit.reset();
        h1.textContent = 'bar';
        return afterNext(el, 'runFontFit');
      }).then(() => {
        sinon.assert.calledOnce(this.fontFit);
      }).then(done, done);
    });

    test('It runs font-fit when `action` changes', function(done) {
      this.dom.innerHTML = '<gaia-header action="back"><h1>foo</h1></gaia-header>';
      var el = this.dom.firstElementChild;

      afterNext(el, 'runFontFit').then(() => {
        this.fontFit.reset();

        // Removing the action should
        // hide the action-button, so
        // font-fit needs to be run.
        el.action = null;

        return afterNext(el, 'runFontFit');
      }).then(() => {
        sinon.assert.calledOnce(this.fontFit);
      }).then(done, done);
    });

    test('It runs font-fit when a button is hidden', function(done) {
      this.dom.innerHTML = `<gaia-header action="back">
        <h1>foo</h1>
        <button></button>
      </gaia-header>`;

      var el = this.dom.firstElementChild;
      var button = el.querySelector('button');

      afterNext(el, 'runFontFit').then(() => {
        this.fontFit.reset();

        // Hiding a button triggers
        // the mutation observer
        button.hidden = true;

        return afterNext(el, 'runFontFit');
      }).then(() => {
        sinon.assert.calledOnce(this.fontFit);
      }).then(done, done);
    });

    test('It runs when a button\'s classList changes', function(done) {
      this.dom.innerHTML = `<gaia-header action="back">
        <h1>foo</h1>
        <button></button>
      </gaia-header>`;

      var el = this.dom.firstElementChild;
      var button = el.querySelector('button');

      afterNext(el, 'runFontFit').then(() => {
        this.runFontFit.reset();

        // Hiding a button triggers
        // the mutation observer
        button.classList.add('hidden');
        return afterNext(el, 'runFontFit');
      }).then(() => {
        sinon.assert.calledOnce(this.runFontFit);
      }).then(done, done);
    });

    test('It copes with several subsequent async mutations', function(done) {
      this.dom.innerHTML = `<gaia-header>
        <h1>foo</h1>
        <button></button>
        <button></button>
      </gaia-header>`;

      var el = this.dom.firstElementChild;
      var buttons = el.querySelectorAll('button');
      var h1 = el.querySelector('h1');

      afterNext(el, 'runFontFit').then(() => {
        h1.textContent = 'Something else';
        return new Promise(resolve => setTimeout(resolve));
      }).then(() => {
        buttons[0].remove();
        el.action = 'back';
        return afterNext(el, 'runFontFit');
      }).then(() => {
        assert.equal(h1.style.marginInlineStart, '0px');
      }).then(done, done);
    });
  });

  suite('title-start and title-end attributes', function() {
    var h1, el;

    function insertHeader(container, attrs) {
      attrs = attrs || {};

      var start = 'titleStart' in attrs ? 'title-start="' +  attrs.titleStart + '"' : '';
      var end = 'titleEnd' in attrs ? 'title-end="' +  attrs.titleEnd + '"': '';

      container.innerHTML = `
        <gaia-header action="back" ${start} ${end}>
          <h1>Title</h1>
        </gaia-header>
      `;

      el = container.firstElementChild;
      h1 = el.querySelector('h1');

      return afterNext(el, 'runFontFit');
    }

    suite('normal cases', function() {
      setup(function(done) {
        insertHeader(this.dom, { titleStart: 50, titleEnd: 100 }).then(done);
      });

      test('are correctly taken into account', function() {
        assert.equal(h1.style.marginInlineStart, '50px');
      });

      test('changing start attribute is taken into account', function(done) {
        el.setAttribute('title-start', '0');

        afterNext(el, 'runFontFit').then(() => {
          assert.equal(h1.style.marginInlineStart, '100px');
          el.removeAttribute('title-start');
          return afterNext(el, 'runFontFit');
        }).then(() => {
          assert.equal(h1.style.marginInlineStart, '100px');
        }).then(done, done);
      });

      test('changing end attribute is taken into account', function(done) {
        assert.equal(h1.style.marginInlineStart, '50px');
        el.setAttribute('title-end', '0');

        afterNext(el, 'runFontFit').then(() => {
          assert.equal(h1.style.marginInlineStart, '-50px');
          el.removeAttribute('title-end');
          return afterNext(el, 'runFontFit');
        }).then(() => {
          assert.equal(h1.style.marginInlineStart, '-50px');
        }).then(done, done);
      });

      test('changing both attributes trigger reformating only once', function(done) {
        el.runFontFit.reset();

        el.setAttribute('title-start', '0');
        el.setAttribute('title-end', '0');

        afterNext(el, 'runFontFit').then(() => {
          sinon.assert.calledOnce(this.runFontFit);
        }).then(done, done);
      });
    });

    suite('corner cases', function() {
      test('0 is not considered as absent', function() {
        insertHeader(this.dom);

        el.setAttribute('title-start', 0);
        el.setAttribute('title-end', 0);

        assert.equal(el.titleStart, 0);
        assert.equal(el.titleEnd, 0);
      });

      test('non-number is considered as absent', function() {
        insertHeader(this.dom, { titleStart: 'invalid', titleEnd: 'invalid' });

        assert.equal(el.titleStart, 50);
        assert.equal(el.titleEnd, 0);
      });

      test('title-start is absent', function() {
        insertHeader(this.dom, { titleEnd: 100 });
        assert.equal(el.titleStart, 50);
        assert.equal(el.titleEnd, 100);
      });

      test('title-end is absent', function() {
        insertHeader(this.dom, { titleStart: 50 });
        assert.equal(el.titleStart, 50);
        assert.equal(el.titleEnd, 0);
      });

      test('setAttribute not called if value didn\'t change', function() {
        insertHeader(this.dom, { titleStart: '50', titleEnd: '50' });

        this.sinon.spy(el, 'setAttribute');
        this.sinon.spy(el, 'attributeChanged');

        el.titleStart = 50;
        el.titleStart = '50';
        el.titleStart = '50px';

        el.titleEnd = 50;
        el.titleEnd = '50';
        el.titleEnd = '50px';

        sinon.assert.notCalled(el.setAttribute);
      });
    });
  });

  test('Should add a click event listener to the action button', function(done) {
    this.dom.innerHTML = '<gaia-header action="menu"></gaia-header>';
    var el = this.dom.firstElementChild;
    var actionButton = el.shadowRoot.querySelector('.action-button');

    el.addEventListener('action', () => done());
    actionButton.click();
  });

  test('triggerAction() should cause a `click` on action button', function() {
    this.sinon.useFakeTimers();

    this.dom.innerHTML = '<gaia-header action="menu"></gaia-header>';
    var el = this.dom.firstElementChild;
    var callback = this.sinon.spy();

    el.addEventListener('action', callback);
    el.triggerAction();
    this.sinon.clock.tick();
    assert.equal(callback.args[0][0].detail.type, 'menu');
  });

  test('runFontFit does not b0rk the markup', function(done) {
    this.dom.innerHTML = '<gaia-header action="back"><h1><p>markup</p></gaia-header>';
    var el = this.dom.firstElementChild;

    afterNext(el, 'runFontFit').then(() => {
      assert.isNotNull(el.querySelector('p'));
    }).then(done, done);
  });

  test('It still works fine after detaching and reattaching', function(done) {
    this.dom.innerHTML = '<gaia-header action="menu"><h1>title</h1></gaia-header>';
    var el = this.dom.firstElementChild;
    var h1 = el.querySelector('h1');

    this.sinon.spy(el, 'observerStop');
    this.sinon.spy(el, 'observerStart');

    afterNext(el, 'runFontFit').then(() => {
      el.runFontFit.reset();

      // Detach from DOM
      el.remove();

      sinon.assert.called(el.observerStop, 'observer disconnected');

      // Change the title text when
      // the element is detached
      h1.textContent = 'bar';

      return afterNext(el, 'runFontFit');
    }).catch(() => {
      sinon.assert.notCalled(this.runFontFit, 'font-fit doesn\'t run when detached');

      // Reattach the element
      this.dom.appendChild(el);
      return afterNext(el, 'runFontFit');
    }).then(() => {
      sinon.assert.called(el.runFontFit, 'font-fit run when re-attached');
      sinon.assert.called(el.observerStart, 'observer started again');

      h1.textContent = 'foo';
      return afterNext(el, 'runFontFit');
    }).then(() => {
      sinon.assert.called(el.runFontFit, 'font-fit run on mutation');
    }).then(done, done);
  });

  suite('no-font-fit', function() {
    test('It prevents font fit running when attached', function(done) {
      this.dom.innerHTML = '<gaia-header no-font-fit><h1>title</h1></gaia-header>';
      var el = this.dom.firstElementChild;

      el.runFontFit.restore();
      this.sinon.spy(el, 'runFontFit');

      afterNext(el, 'runFontFit').then(() => {
        sinon.assert.notCalled(el.fontFit);
      }).then(done, done);
    });

    test('It runs font-fit when the attribute is removed', function(done) {
      this.dom.innerHTML = '<gaia-header no-font-fit><h1>title</h1></gaia-header>';
      var el = this.dom.firstElementChild;

      afterNext(el, 'runFontFit').then(() => {
        sinon.assert.notCalled(el.fontFit);
        this.fontFit.reset();
        el.removeAttribute('no-font-fit');
        return afterNext(el, 'runFontFit');
      }).then(() => {
        sinon.assert.called(this.fontFit);
      }).then(done, done);
    });

    test('It only runs fontFit when the value changes from truthey to falsey',
      function(done) {
      this.dom.innerHTML = '<gaia-header no-font-fit><h1>title</h1></gaia-header>';
      var el = this.dom.firstElementChild;

      afterNext(el, 'runFontFit').then(() => {
        el.noFontFit = 'foo';
        return afterNext(el, 'setTitleStyle');
      }).catch(() => {
        sinon.assert.notCalled(el.setTitleStyle);
        el.noFontFit = '';
        return afterNext(el, 'setTitleStyle');
      }).catch(() => {
        sinon.assert.notCalled(el.setTitleStyle);
        el.noFontFit = null;
        return afterNext(el, 'setTitleStyle');
      }).then(() => {
        sinon.assert.calledOnce(el.setTitleStyle);
        el.noFontFit = false;
        return afterNext(el, 'setTitleStyle');
      }).catch(() => {
        sinon.assert.calledOnce(el.setTitleStyle);
      }).then(done, done);
    });
  });

  suite('style', function() {
    setup(function() {

      // Create and inject element
      this.dom.innerHTML = `
        <gaia-header action="menu">
          <h1>my title</h1>
          <div class="indicator">indicator</div>
          <button id="my-button">my button</button>
        </gaia-header>`;

      this.element = this.dom.firstElementChild;

      // Insert into DOM to get styling
      document.body.appendChild(this.element);
    });

    teardown(function() {
      document.body.removeChild(this.element);
    });

    test('Should place title after action button', function() {
      var button = this.element.shadowRoot.querySelector('.action-button');
      var title = this.element.querySelector('h1');
      var span = document.createElement('span');

      // Wrap text in span so we can
      // measure postition of text node
      span.appendChild(title.firstChild);
      title.appendChild(span);

      var buttonX = button.getBoundingClientRect().left;
      var titleX = span.getBoundingClientRect().left;

      assert.isTrue(titleX > buttonX);
    });

    test('Should hang other buttons to the right', function() {
      var button = this.element.querySelector('#my-button');

      // Get positions
      var elementRight = this.element.getBoundingClientRect().right;
      var buttonRight = Math.round(button.getBoundingClientRect().right);

      assert.equal(buttonRight, elementRight);
    });

    test('Should never overlap buttons with title', function() {
      var button = this.element.querySelector('#my-button');
      var indicator = this.element.querySelector('.indicator');
      var otherButton = document.createElement('button');
      var title = this.element.querySelector('h1');

      title.textContent = 'really long title really long title really long title';
      otherButton.textContent = 'another button';
      this.element.appendChild(otherButton);

      // Get positions
      var buttonLeft = button.getBoundingClientRect().left;
      var otherButtonleft = otherButton.getBoundingClientRect().left;
      var indicatorLeft = indicator.getBoundingClientRect().left;
      var titleRight = title.getBoundingClientRect().right;

      assert.isTrue(titleRight <= buttonLeft, titleRight + ' <= ' + buttonLeft);
      assert.isTrue(titleRight <= otherButtonleft, titleRight + ' <= ' + otherButtonleft);
      assert.isTrue(titleRight <= indicatorLeft, titleRight + ' <= ' + indicatorLeft);
    });

    test('Should import all elements', function() {
      var nodes = this.element.querySelectorAll('#my-button, .indicator, h1');
      var content = this.element.shadowRoot.querySelector('.inner > content');
      var distributed = Array.from(content.getDistributedNodes());

      Array.from(nodes).forEach((elt) => {
        assert.include(distributed, elt);
      });
    });
  });

  suite('GaiaHeader#onActionButtonClick()', function(done) {
    setup(function() {
      this.sinon.useFakeTimers();
    });

    test('Should emit an \'action\' event', function() {
      this.dom.innerHTML = '<gaia-header action="menu"></gaia-header>';
      var element = this.dom.firstElementChild;
      var callback = this.sinon.spy();

      element.addEventListener('action', callback);
      element.onActionButtonClick();
      this.sinon.clock.tick();

      sinon.assert.called(callback);
    });

    test('Should pass the action type as `event.detail.type`', function() {
      this.dom.innerHTML = '<gaia-header action="menu"></gaia-header>';
      var element = this.dom.firstElementChild;
      var callback = this.sinon.spy();

      element.addEventListener('action', callback);
      element.onActionButtonClick();
      this.sinon.clock.tick();

      assert.equal(callback.args[0][0].detail.type, 'menu');
    });

    test('Empty icon buttons should be 50px wide', function() {
      this.dom.innerHTML = `<style>
        gaia-header button:before {content: 'very long pseudo element content'}
      </style>
      <gaia-header action="menu">
        <button data-icon></button>
      </gaia-header>`;

      var el = this.dom.querySelector('gaia-header');
      var button = el.querySelector('button');

      assert.equal(button.clientWidth, 50, 'empty data-icon buttons should be 50px');

      this.dom.innerHTML = `<style>
        gaia-header button:before {content: 'very long pseudo element content'}
      </style>
      <gaia-header action="menu">
        <button></button>
      </gaia-header>`;

      el = this.dom.querySelector('gaia-header');
      button = el.querySelector('button');

      assert.ok(button.clientWidth > 50, 'non icon buttons can be natural width');
    });
  });

  suite('Title centering:', function() {
    test('It centers the header between the surrounding buttons', function(done) {
      this.dom.innerHTML = `<gaia-header action="menu">
        <h1>Header title</h1>
        <button></button>
        <button></button>
      </gaia-header>`;

      var el = this.dom.firstElementChild;
      var h1 = el.querySelector('h1');

      afterNext(el, 'runFontFit').then(() => {
        assert.equal(h1.style.marginInlineStart, '50px');

        this.dom.innerHTML = `<gaia-header action="menu">
          <h1>Header title</h1>
        </gaia-header>`;

        el = this.dom.firstElementChild;
        h1 = el.querySelector('h1');

        return afterNext(el, 'runFontFit');
      }).then(() => {
        assert.equal(h1.style.marginInlineStart, '-50px');
      }).then(done, done);
    });

    test('It doesn\'t center if there is not enough space', function(done) {
      this.dom.innerHTML = `<gaia-header action="menu">
        <h1>This title is far far far far far far far far far far far far
        far far too long to center</h1>
        <button></button>
        <button></button>
      </gaia-header>`;

      var el = this.dom.firstElementChild;
      var h1 = el.querySelector('h1');

      afterNext(el, 'runFontFit').then(() => {
        assert.equal(h1.style.marginInlineStart, '0px');
      }).then(done, done);
    });

    test('It centers with a not too decreased font size', function(done) {
      this.dom.innerHTML = `<gaia-header action="menu">
        <h1></h1>
        <button></button>
        <button></button>
      </gaia-header>`;

      var el = this.dom.firstElementChild;
      var h1 = el.querySelector('h1');

      GaiaHeader.prototype.fontFit.restore();
      this.sinon.stub(GaiaHeader.prototype, 'fontFit');
      GaiaHeader.prototype.fontFit.returns({textWidth: 200, fontSize: 20});
      afterNext(el, 'runFontFit').then(() => {
        h1.textContent = 'some title';

        return afterNext(el, 'runFontFit');
      }).then(() => {
        sinon.assert.calledOnce(GaiaHeader.prototype.fontFit);
        sinon.assert.calledWithMatch(
          GaiaHeader.prototype.fontFit,
          this.sinon.match.any, this.sinon.match.any, { min: 20 }
        );
        assert.equal(h1.style.fontSize, '20px');
      }).then(done, done);
    });

    test('It doesn\'t have start/end padding if title is centerable', function(done) {
      this.dom.innerHTML = `<gaia-header action="menu">
        <h1>Title can be center</h1>
        <button></button>
      </gaia-header>`;

      var el = this.dom.firstElementChild;
      var h1 = el.querySelector('h1');

      afterNext(el, 'runFontFit').then(() => {
        var style = getComputedStyle(h1);

        // NOTE: ComputedStyle doesn't
        // know what `MozPadding(Start|End)` is.
        assert.equal(style.paddingLeft, '0px');
        assert.equal(style.paddingRight, '0px');
      }).then(done, done);
    });

    test('It should apply 10px paddings when overflowing and no buttons before/after',
      function(done) {
      this.dom.innerHTML = `<gaia-header>
        <h1>This title is far far far far far far far far far far far
        far far far far far far far too long to center</h1>
      </gaia-header>`;

      var el = this.dom.firstElementChild;
      var h1 = el.querySelector('h1');

      afterNext(el, 'runFontFit').then(() => {
        assert.equal(getComputedStyle(h1).paddingLeft, '10px');
        assert.equal(getComputedStyle(h1).paddingRight, '10px');
        sinon.assert.calledWithMatch(
          GaiaHeader.prototype.fontFit,
          this.sinon.match.any, windowWidth - 20); // 2 * 10px
      }).then(done, done);
    });
  });

  suite('Performance', function() {
    setup(function() {
      var clientWidth = Object.getOwnPropertyDescriptor(Element.prototype, 'clientWidth');
      var clientWidth_spy = {
        get: this.sinon.spy(function() {
          return clientWidth.get.call(this);
        })
      };

      this.clientWidth_spy = clientWidth_spy;
      this.clientWidth = clientWidth;

      // Overwrite `clientWidth` descriptor for
      // just <button> so we can spy on it.
      Object.defineProperty(Element.prototype, 'clientWidth', clientWidth_spy);
    });

    teardown(function() {
      Object.defineProperty(Element.prototype, 'clientWidth', this.clientWidth);
    });

    test('It doesn\'t call `.clientWidth` if title-start is used', function() {
      this.dom.innerHTML = `<gaia-header title-start="50">
        <button></button>
        <h1>Title</h1>
      </gaia-header>`;

      var el = this.dom.firstElementChild;
      var titleStart = el.titleStart;

      sinon.assert.notCalled(this.clientWidth_spy.get, 'didn\'t query DOM');
      assert.equal(titleStart, 50);
    });

    test('It doesn\'t call `.clientWidth` if title-end is used', function() {
      this.dom.innerHTML = `<gaia-header title-end="50">
        <h1>Title</h1>
        <button></button>
      </gaia-header>`;

      var el = this.dom.firstElementChild;
      var titleEnd = el.titleEnd;

      sinon.assert.notCalled(this.clientWidth_spy.get, 'didn\'t query DOM');
      assert.equal(titleEnd, 50);
    });

    test('It doesn\'t  call `.clientWidth` if their are no user buttons', function() {
      this.dom.innerHTML = `<gaia-header action="back">
        <h1>Title</h1>
      </gaia-header>`;

      this.dom.innerHTML = `<gaia-header>
        <h1>Title</h1>
      </gaia-header>`;

      sinon.assert.notCalled(this.clientWidth_spy.get, 'didn\'t query DOM');
    });

    test('It uses `window.innerWidth` by default', function(done) {
      this.dom.innerHTML = `<gaia-header action="back">
        <h1>Title</h1>
      </gaia-header>`;

      var el = this.dom.firstElementChild;

      afterNext(el, 'runFontFit').then(() => {
        sinon.assert.called(this.innerWidth_spy);
        sinon.assert.notCalled(this.clientWidth_spy.get, 'queried DOM');
      }).then(done, done);
    });

    test('It uses `gaiaHeader.clientWidth` when the `not-flush` attribute is used', function(done) {
      this.dom.innerHTML = `<gaia-header action="back" not-flush>
        <h1>Title</h1>
      </gaia-header>`;

      var el = this.dom.firstElementChild;

      afterNext(el, 'runFontFit').then(() => {
        sinon.assert.called(this.clientWidth_spy.get, 'queried DOM');
      }).then(done, done);
    });
  });

  test('It works with multiple headers', function(done) {
    this.dom.innerHTML = `<gaia-header action="back">
      <h1 class="title-1">Title 1</h1>
      <h1 class="title-2" hidden>Title 2</h1>
      <button></button>
      <button></button>
    </gaia-header>`;

    var el = this.dom.firstElementChild;
    var title1 = el.querySelector('.title-1');
    var title2 = el.querySelector('.title-2');

    afterNext(el, 'runFontFit').then(() => {
      assert.equal(title1.style.marginInlineStart, '50px');
      assert.equal(title2.style.marginInlineStart, '50px');
    }).then(() => {
      this.fontFit.reset();
      title1.hidden = true;
      title2.hidden = false;
      return afterNext(el, 'runFontFit');
    }).then(() => {
      sinon.assert.notCalled(this.fontFit, 'font-fit not required');
      assert.equal(title1.style.marginInlineStart, '50px');
      assert.equal(title2.style.marginInlineStart, '50px');
    }).then(done, done);
  });

  test('it clears pending async tasks when the element is detached', function(done) {
    this.dom.innerHTML = '<gaia-header action="menu"><h1>Title</h1></gaia-header>';
    var el = this.dom.firstElementChild;

    el.remove();

    afterNext(el, 'runFontFit').then(() => {
      done(new Error('should not have run'));
    }).catch(() => done());
  });

  test('it clears pending async `setTitleStyles`', function(done) {
    this.dom.innerHTML = '<gaia-header action="menu"><h1>Title</h1></gaia-header>';
    var el = this.dom.firstElementChild;

    el.runFontFit();
    el.remove();

    afterNext(el, 'setTitleStyle').then(() => {
      done('timed out');
    }).catch(() => done());
  });

  suite('accessibility', function() {
    /**
     * Accessibility test utils module tests the following things, amongst other
     * checks (all at once).:
     *  - ARIA attributes specific checks
     *  - accesskey uniqueness if applicable
     *  - Presence of alternative descriptions, labels and names
     *  - Color contrast
     *  - Markup is semantically correct from a11y standpoint
     *  - Heading order
     *  - Frame/document title and language
     *  - Landmarks if applicable
     *  - Keyboard focusability and tabindex
     *
     * Its checks are called at different stages and within different states of
     * the component.
     */

    test('gaia-header passes accessibility checks with and without supported ' +
      'action buttons', function(done) {
      this.dom.innerHTML = `<gaia-header></gaia-header>
        <gaia-header action="unsupported"></gaia-header>
        <gaia-header action="menu"></gaia-header>
        <gaia-header action="close"></gaia-header>
        <gaia-header action="back"></gaia-header>`;

      accessibility.check(this.dom).then(done, done);
    });

    test('gaia-header passes accessibility checks with its attributes ' +
      'dynamically changing', function(done) {
      this.dom.innerHTML = '<gaia-header action="back"><h1>Title</h1></gaia-header>';
      var el = this.dom.firstElementChild;
      var h1 = el.querySelector('h1');
      assert.equal(el.els.actionButton.getAttribute('data-l10n-id'),
        'gaia-header-back');

      accessibility.check(this.dom)
        .then(() => {
          /* change to another supported action */
          el.setAttribute('action', 'close');
          assert.equal(el.els.actionButton.getAttribute('data-l10n-id'),
            'gaia-header-close');
          return accessibility.check(this.dom);
        })
        .then(() => {
          /* change to an unsupported action */
          el.setAttribute('action', 'unsupported');
          assert.notOk(el.els.actionButton.getAttribute('data-l10n-id'));
          return accessibility.check(this.dom);
        })
        .then(() => {
          /* back to something supported via attribute field */
          el.action = 'menu';
          assert.equal(el.els.actionButton.getAttribute('data-l10n-id'),
            'gaia-header-menu');
          return accessibility.check(this.dom);
        })
        .then(() => {
          /* change title to very long text */
          h1.textContent = 'long long long long long long long long long ' +
            'long long long long long';
          return afterNext(el, 'runFontFit');
        })
        .then(() => accessibility.check(this.dom))
        .then(done, done);
    });

    test('gaia-header passes accessibility checks when it is removed and ' +
      'then dynamically added back into the DOM', function(done) {
      this.dom.innerHTML = '<gaia-header action="back"><h1>Title</h1></gaia-header>';
      var el = this.dom.firstElementChild;
      el.remove();
      this.dom.appendChild(el);

      accessibility.check(this.dom).then(done, done);
    });

    test('gaia-header passes accessibility checks when it has multiple headings',
      function(done) {
        this.dom.innerHTML = `<gaia-header action="back">
          <h1 class="title-1">Title 1</h1>
          <h1 class="title-2" hidden>Title 2</h1>
          <button>Foo</button>
          <button>Bar</button>
        </gaia-header>`;

        var el = this.dom.firstElementChild;
        var title1 = el.querySelector('.title-1');
        var title2 = el.querySelector('.title-2');

        afterNext(el, 'runFontFit')
          .then(() => accessibility.check(this.dom))
          .then(() => {
            this.fontFit.reset();
            title1.hidden = true;
            title2.hidden = false;
            return afterNext(el, 'runFontFit');
          })
          .then(() => accessibility.check(this.dom))
          .then(done, done);
      });
  });
});

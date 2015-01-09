/*global window,assert,suite,setup,teardown,sinon,test*/
/*jshint esnext:true*/

suite('GaiaHeader', function() {
  'use strict';

  var GaiaHeader = window['gaia-header'];
  var realGaiaHeaderFontFit;

  setup(function() {
    this.sandbox = sinon.sandbox.create();
    this.sandbox.useFakeTimers();

    this.container = document.createElement('div');
    document.body.appendChild(this.container);
    this.sandbox.spy(HTMLElement.prototype, 'addEventListener');

    realGaiaHeaderFontFit = window['./lib/font-fit'];
    window['./lib/font-fit'] = window['./test/mocks/mock_font_fit'];
  });

  teardown(function() {
    this.sandbox.restore();
    this.container.remove();

    window['./lib/font-fit'] = realGaiaHeaderFontFit;
  });

  test('It hides the action button if no action type defined', function() {
    this.container.innerHTML = '<gaia-header></gaia-header>';
    var element = this.container.firstElementChild;
    var inner = element.shadowRoot.querySelector('.inner');
    assert.isFalse(inner.classList.contains('supported-action'));
    assert.equal(element.action, null);
  });

  test('It doesn\'t show an action button for unsupported action types', function() {
    this.container.innerHTML = '<gaia-header action="unsupported"></gaia-header>';
    var element = this.container.firstElementChild;
    var inner = element.shadowRoot.querySelector('.inner');
    assert.isFalse(inner.classList.contains('supported-action'));

    // In the future, we may want to have "null" here in this case.
    assert.equal(element.action, 'unsupported');
  });

  test('It adds the correct icon attribute for the action type', function() {
    ['menu', 'close', 'back'].forEach(function(type) {
      this.container.innerHTML = '<gaia-header action="' + type + '"></gaia-header>';
      var element = this.container.firstElementChild;
      var actionButton = element.shadowRoot.querySelector('.action-button');
      var inner = element.shadowRoot.querySelector('.inner');
      assert.isTrue(actionButton.classList.contains('icon-' + type));
      assert.isTrue(inner.classList.contains('supported-action'));
      assert.equal(element.action, type);
    }, this);
  });

  test('It catches changes to the `action` attribute', function() {
    this.container.innerHTML = '<gaia-header action="back"><h1></h1></gaia-header>';
    var element = this.container.firstElementChild;
    var h1 = element.querySelector('h1');
    var actionButton = element.shadowRoot.querySelector('.action-button');
    var inner = element.shadowRoot.querySelector('.inner');
    assert.isTrue(actionButton.classList.contains('icon-back'));
    assert.equal(element.action, 'back');

    this.sandbox.stub(realGaiaHeaderFontFit, 'reformatHeading');

    /* change to another supported action */
    element.setAttribute('action', 'close');
    this.sandbox.clock.tick();
    assert.isTrue(actionButton.classList.contains('icon-close'));
    assert.isTrue(inner.classList.contains('supported-action'));
    assert.equal(element.action, 'close');
    sinon.assert.calledWith(realGaiaHeaderFontFit.reformatHeading, h1);

    /* change to an unsupported action */
    element.setAttribute('action', 'unsupported');
    this.sandbox.clock.tick();
    assert.isFalse(actionButton.classList.contains('icon-unsupported'));
    assert.isFalse(inner.classList.contains('supported-action'));

    // In the future, we may want to have "null" here in this case.
    assert.equal(element.action, 'unsupported');
    sinon.assert.calledWith(realGaiaHeaderFontFit.reformatHeading, h1);

    /* back to something supported */
    element.setAttribute('action', 'menu');
    this.sandbox.clock.tick();
    assert.isTrue(actionButton.classList.contains('icon-menu'));
    assert.isTrue(inner.classList.contains('supported-action'));
    assert.equal(element.action, 'menu');
    sinon.assert.calledWith(realGaiaHeaderFontFit.reformatHeading, h1);
  });

  suite('title-start, title-end, available-width attributes', function() {
    var h1, element;

    function insertHeader(container, attrs = {}) {
      var start = 'titleStart' in attrs ?
        'title-start="' +  attrs.titleStart + '"' : '';
      var end = 'titleEnd' in attrs ?
        'title-end="' +  attrs.titleEnd + '"': '';
      var width = 'availableWidth' in attrs ?
        'available-width="' +  attrs.availableWidth + '"': '';

      container.innerHTML = `
        <gaia-header ${start} ${end} ${width}>
          <h1></h1>
        </gaia-header>
      `;

      element = container.firstElementChild;
      // workaround to trigger attachedCallback (bug 1102502)
      element.remove();
      container.appendChild(element);

      h1 = element.querySelector('h1');
    }

    setup(function() {
      this.sandbox.stub(realGaiaHeaderFontFit, 'reformatHeading');
    });

    suite('normal cases', function() {
      setup(function() {
        insertHeader(
          this.container,
          { titleStart: 50, titleEnd: 100, availableWidth: 200 });
      });

      test('are correctly taken into account', function() {
        sinon.assert.calledWith(
          realGaiaHeaderFontFit.reformatHeading,
          h1, 50, 100, 200
        );

        assert.equal(element['title-start'], 50);
        assert.equal(element['title-end'], 100);
        assert.equal(element['available-width'], 200);
      });

      test('changing start attribute is taken into account', function() {
        element.setAttribute('title-start', '0');
        assert.equal(element['title-start'], 0);

        this.sandbox.clock.tick();

        sinon.assert.calledWith(
          realGaiaHeaderFontFit.reformatHeading,
          h1, 0, 100, 200
        );

        element.removeAttribute('title-start');
        assert.equal(element['title-start'], null);

        this.sandbox.clock.tick();

        sinon.assert.calledWith(
          realGaiaHeaderFontFit.reformatHeading,
          h1, null, 100, 200
        );
      });

      test('changing end attribute is taken into account', function() {
        element.setAttribute('title-end', '0');
        assert.equal(element['title-end'], 0);

        this.sandbox.clock.tick();

        sinon.assert.calledWith(
          realGaiaHeaderFontFit.reformatHeading,
          h1, 50, 0, 200
        );

        element.removeAttribute('title-end');
        assert.equal(element['title-end'], null);

        this.sandbox.clock.tick();

        sinon.assert.calledWith(
          realGaiaHeaderFontFit.reformatHeading,
          h1, 50, null, 200
        );
      });

      test('changing width attribute is taken into account', function() {
        element.setAttribute('available-width', '50');
        assert.equal(element['available-width'], 50);

        this.sandbox.clock.tick();
        sinon.assert.calledWith(
          realGaiaHeaderFontFit.reformatHeading,
          h1, 50, 100, 50
        );

        element.removeAttribute('available-width');
        assert.equal(element['available-width'], null);

        this.sandbox.clock.tick();

        sinon.assert.calledWith(
          realGaiaHeaderFontFit.reformatHeading,
          h1, 50, 100, null
        );
      });

      test('changing all attributes trigger reformating only once', function() {
        realGaiaHeaderFontFit.reformatHeading.reset();

        element.setAttribute('title-start', '0');
        element.setAttribute('title-end', '0');
        element.setAttribute('available-width', '50');
        this.sandbox.clock.tick();

        sinon.assert.calledOnce(realGaiaHeaderFontFit.reformatHeading);
      });
    });

    suite('some attributes are absent', function() {
      test('title-start is absent', function() {
        insertHeader(
          this.container,
          { titleEnd: 100, availableWidth: 200 }
        );

        sinon.assert.calledWith(
          realGaiaHeaderFontFit.reformatHeading,
          h1, null, 100, 200
        );
      });

      test('title-end is absent', function() {
        insertHeader(
          this.container,
          { titleStart: 50, availableWidth: 200 }
        );

        sinon.assert.calledWith(
          realGaiaHeaderFontFit.reformatHeading,
          h1, 50, null, 200
        );
      });

      test('available-width is absent', function() {
        insertHeader(
          this.container,
          { titleStart: 50, titleEnd: 100 }
        );

        sinon.assert.calledWith(
          realGaiaHeaderFontFit.reformatHeading,
          h1, 50, 100, null
        );
      });
    });

    suite('error cases', function() {
      test('0 is not considered as absent', function() {
        insertHeader(
          this.container,
          { titleStart: 0, titleEnd: 0, availableWidth: 0 }
        );

        sinon.assert.calledWith(
          realGaiaHeaderFontFit.reformatHeading,
          h1, 0, 0, 0
        );
      });

      test('non-number is considered as absent', function() {
        insertHeader(
          this.container,
          { titleStart: 'invalid', titleEnd: 'invalid', availableWidth: 'invalid' }
        );

        sinon.assert.calledWith(
          realGaiaHeaderFontFit.reformatHeading,
          h1, null, null, null
        );
        assert.equal(element['title-start'], null);
        assert.equal(element['title-end'], null);
        assert.equal(element['available-width'], null);
      });
    });

  });

  test('Should add a click event listener to the action button if an action defined', function() {
    this.container.innerHTML = '<gaia-header action="menu"></gaia-header>';
    var element = this.container.firstElementChild;
    var actionButton = element.shadowRoot.querySelector('.action-button');
    assert.isTrue(HTMLElement.prototype.addEventListener.withArgs('click').calledOn(actionButton));
  });

  test('Should add the shadow-dom stylesheet to the root of the element', function() {
    this.container.innerHTML = '<gaia-header action="menu"></gaia-header>';
    var element = this.container.firstElementChild;
    assert.ok(element.querySelector('style'));
  });

  test('triggerAction() should cause a `click` on action button', function() {
    this.container.innerHTML = '<gaia-header action="menu"></gaia-header>';
    var element = this.container.firstElementChild;
    var callback = sinon.spy();
    element.addEventListener('action', callback);
    element.triggerAction();
    this.sandbox.clock.tick(1);
    assert.equal(callback.args[0][0].detail.type, 'menu');
  });

  test('It fails silently when `window.getComputedStyle()` returns null (ie. hidden iframe)', function() {
    this.sandbox.stub(window, 'getComputedStyle').returns(null);
    this.container.innerHTML = '<gaia-header action="menu"><h1>title</h1></gaia-header>';
    var element = this.container.firstElementChild;

    // Insert into DOM to get styling
    document.body.appendChild(element);
  });

  test('runFontFit does not b0rk the markup', function() {
    this.container.innerHTML = '<gaia-header action="back"><h1><p>markup</p></gaia-header>';

    var element = this.container.firstElementChild;
    element.runFontFit();

    assert.isNotNull(element.querySelector('p'));
  });

  test('It should still work fine after detaching and reattaching', function() {
    this.container.innerHTML = '<gaia-header action="menu"><h1>title</h1></gaia-header>';
    var element = this.container.firstElementChild;
    var h1 = element.querySelector('h1');

    this.sandbox.stub(realGaiaHeaderFontFit, 'disconnectHeadingObserver');
    element.remove();
    sinon.assert.called(realGaiaHeaderFontFit.disconnectHeadingObserver);

    this.sandbox.stub(realGaiaHeaderFontFit, 'reformatHeading');
    this.sandbox.stub(realGaiaHeaderFontFit, 'observeHeadingChanges');
    this.container.appendChild(element);

    sinon.assert.calledWith(realGaiaHeaderFontFit.reformatHeading, h1);
    sinon.assert.calledWith(realGaiaHeaderFontFit.observeHeadingChanges, h1);
  });

  test('no-font-fit attribute', function() {
    this.sandbox.stub(realGaiaHeaderFontFit, 'reformatHeading');
    this.sandbox.stub(realGaiaHeaderFontFit, 'observeHeadingChanges');

    this.container.innerHTML = '<gaia-header no-font-fit><h1>title</h1></gaia-header>';

    var element = this.container.firstElementChild;
    var h1 = element.querySelector('h1');

    assert.equal(element['no-font-fit'], true);

    sinon.assert.notCalled(realGaiaHeaderFontFit.reformatHeading);
    sinon.assert.notCalled(realGaiaHeaderFontFit.observeHeadingChanges);

    element.setAttribute('title-start', '5');
    this.sandbox.clock.tick();
    sinon.assert.notCalled(realGaiaHeaderFontFit.reformatHeading);

    element.removeAttribute('no-font-fit');
    assert.equal(element['no-font-fit'], false);
    this.sandbox.clock.tick();

    sinon.assert.calledWith(realGaiaHeaderFontFit.reformatHeading, h1);
    sinon.assert.calledWith(realGaiaHeaderFontFit.observeHeadingChanges, h1);
  });

  suite('style', function() {
    setup(function() {

      // Create and inject element
      this.container.innerHTML = `
        <gaia-header action="menu">,
          <h1>my title</h1>,
          <button id="my-button">my button</button>,
        </gaia-header>`;

      this.element = this.container.firstElementChild;

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
      var otherButton = document.createElement('button');
      var title = this.element.querySelector('h1');

      title.textContent = 'really long title really long title really long title';
      otherButton.textContent = 'another button';
      this.element.appendChild(otherButton);

      // Get positions
      var buttonLeft = button.getBoundingClientRect().left;
      var otherButtonleft = otherButton.getBoundingClientRect().left;
      var titleRight = title.getBoundingClientRect().right;

      assert.isTrue(titleRight <= buttonLeft, titleRight + ' <= ' + buttonLeft);
      assert.isTrue(titleRight <= otherButtonleft, titleRight + ' <= ' +  otherButtonleft);
    });
  });

  suite('GaiaHeader#onActionButtonClick()', function(done) {
    test('Should emit an \'action\' event', function() {
      this.container.innerHTML = '<gaia-header action="menu"></gaia-header>';
      var element = this.container.firstElementChild;
      var callback = sinon.spy();

      element.addEventListener('action', callback);
      element.onActionButtonClick();
      this.sandbox.clock.tick(1);

      sinon.assert.called(callback);
    });

    test('Should pass the action type as `event.detail.type`', function() {
      this.container.innerHTML = '<gaia-header action="menu"></gaia-header>';
      var element = this.container.firstElementChild;
      var callback = sinon.spy();

      element.addEventListener('action', callback);
      element.onActionButtonClick();
      this.sandbox.clock.tick(1);

      assert.equal(callback.args[0][0].detail.type, 'menu');
    });
  });
});

'use strict';

goog.provide('CustomFields.eventparam');
goog.require('Blockly.Field');

CustomFields.eventparam = function (opt_value, opt_color, opt_workspace, opt_validator) {
    opt_value = this.doClassValidation_(opt_value);
    if (opt_value === null) {
        opt_value = '';
    }  // Else the original value is fine.

    this.opt_color_ = opt_color;
    this.displayLocation = CustomFields.eventparam.DISPLAY_BELOW;
    this.opt_workspace = opt_workspace;
    CustomFields.eventparam.superClass_.constructor.call(
        this, opt_value, opt_validator);
};
Blockly.utils.object.inherits(CustomFields.eventparam, Blockly.Field);

CustomFields.eventparam.prototype.EDITABLE = false;
CustomFields.eventparam.timeout = 500;
CustomFields.eventparam.isInDrag = false;
CustomFields.eventparam.openFieldFlydown_ = null;
CustomFields.eventparam.showPid_ = 0;
CustomFields.eventparam.DISPLAY_BELOW = "BELOW";
CustomFields.eventparam.DISPLAY_RIGHT = "RIGHT";
CustomFields.eventparam.DISPLAY_LOCATION = CustomFields.eventparam.DISPLAY_BELOW;
CustomFields.eventparam.prototype.fieldCSSClassName = 'blocklyFieldFlydownField';
CustomFields.eventparam.prototype.flyoutCSSClassName = 'blocklyFieldFlydownFlydown';

CustomFields.eventparam.prototype.init = function (block) {
    CustomFields.eventparam.superClass_.init.call(this, block);

    // Remove inherited field css classes ...
    Blockly.utils.dom.removeClass(/** @type {!Element} */(this.fieldGroup_),
        'blocklyEditableText');
    Blockly.utils.dom.removeClass(/** @type {!Element} */(this.fieldGroup_),
        'blocklyNoNEditableText');
    // ... and add new ones, so that look and feel of flyout fields can be customized
    Blockly.utils.dom.addClass(/** @type {!Element} */(this.fieldGroup_),
        this.fieldCSSClassName);

    this.mouseOverWrapper_ =
        Blockly.bindEvent_(this.fieldGroup_, 'mouseover', this, this.onMouseOver_);
    this.mouseOutWrapper_ =
        Blockly.bindEvent_(this.fieldGroup_, 'mouseout', this, this.onMouseOut_);
    this.mouseDownWrapper_ =
        Blockly.bindEventWithChecks_(this.fieldGroup_, 'mousedown', this,
            function (_event) {
                this.isInDrag = true;
            }
        );
    this.mouseUpWrapper_ =
        Blockly.bindEventWithChecks_(document, 'mouseup', this,
            function (_event) {
                this.isInDrag = false;
            }
        );
};

CustomFields.eventparam.prototype.onMouseOver_ = function (e) {
    if (!this.sourceBlock_.isInFlyout) { // [lyn, 10/22/13] No flydowns in a flyout!
        CustomFields.eventparam.showPid_ =
            window.setTimeout(this.showFlydownMaker_(), CustomFields.eventparam.timeout);
    }

    // This event has been handled.  No need to bubble up to the document.
    e.stopPropagation();
};

CustomFields.eventparam.prototype.onMouseOut_ = function (e) {
    // Clear any pending timer event to show flydown
    window.clearTimeout(CustomFields.eventparam.showPid_);
    e.stopPropagation();
};

CustomFields.eventparam.prototype.showFlydownMaker_ = function () {
    var field = this; // Name receiver in variable so can close over this variable in returned thunk

    return function () {
        if (CustomFields.eventparam.showPid_ !== 0 &&
            !this.isInDrag &&
            !Blockly.FieldTextInput.htmlInput_) {
            try {
                field.showFlydown_();
            } catch (e) {
                console.error('Failed to show flydown', e);
            }
        }
        CustomFields.eventparam.showPid_ = 0;
    };
};

CustomFields.eventparam.prototype.showFlydown_ = function () {
    Blockly.hideChaff();
    var flydown = Blockly.getMainWorkspace().getFlydown();

    // Add flydown to top-level svg, *not* to main workspace svg
    // This is essential for correct positioning of flydown via translation
    // (If it's in workspace svg, it will be additionally translated by
    //  workspace svg translation relative to Blockly.svg.)
    flydown.targetWorkspace = this.opt_workspace;
    flydown.targetWorkspace_ = this.opt_workspace;
    Blockly.getMainWorkspace().getParentSvg().appendChild(flydown.svgGroup_);

    // Adjust scale for current zoom level
    var scale = flydown.targetWorkspace_.scale;
    flydown.workspace_.setScale(scale);

    flydown.setCSSClass(this.flyoutCSSClassName);

    var blocksXMLText = this.flydownBlocksXML_();
    var blocksDom = Blockly.Xml.textToDom(blocksXMLText);
    // [lyn, 11/10/13] Use goog.dom.getChildren rather than .children or
    //    .childNodes to make this code work across browsers.
    var blocksXMLList = blocksDom.children;

    var xy = Blockly.getMainWorkspace().getSvgXY(this.borderRect_);
    var borderBBox = this.borderRect_.getBBox();
    if (this.displayLocation == CustomFields.eventparam.DISPLAY_BELOW) {
        xy.y += borderBBox.height * scale;
    } else { // Display right.
        xy.x += borderBBox.width * scale;
    }

    flydown.showAt(blocksXMLList, xy.x, xy.y);
    CustomFields.eventparam.openFieldFlydown_ = this;
};

CustomFields.eventparam.hide = function () {
    // Clear any pending timer event to show flydown.
    window.clearTimeout(CustomFields.eventparam.showPid_);
    // Hide any displayed flydown.
    var flydown = Blockly.getMainWorkspace().getFlydown();
    if (flydown) {
        flydown.hide();
    }
};

CustomFields.eventparam.prototype.onHtmlInputChange_ = function (e) {
    goog.asserts.assertObject(Blockly.FieldTextInput.htmlInput_);
    var htmlInput = Blockly.FieldTextInput.htmlInput_;
    var text = htmlInput.value;
    if (text !== htmlInput.oldValue_) {
        htmlInput.oldValue_ = text;
        var valid = true;
        if (this.sourceBlock_) {
            valid = this.callValidator(htmlInput.value);
        }
        if (valid === null) {
            Blockly.utils.dom.addClass(htmlInput, 'blocklyInvalidInput');
        } else {
            Blockly.utils.dom.removeClass(htmlInput, 'blocklyInvalidInput');
            this.setText(valid);
        }
    } else if (goog.userAgent.WEBKIT) {
        // Cursor key.  Render the source block to show the caret moving.
        // Chrome only (version 26, OS X).
        this.sourceBlock_.render();
    }
    this.resizeEditor_();
    Blockly.svgResize(this.sourceBlock_.workspace);
};


CustomFields.eventparam.prototype.dispose = function () {
    // Call parent's destructor.
    Blockly.FieldTextInput.prototype.dispose.call(this);
};



CustomFields.eventparam.prototype.initView = function () {

    this.borderRect_ = Blockly.utils.dom.createSvgElement(
        Blockly.utils.Svg.RECT, {
        'x': 0,
        'y': 0,
        'height': this.size_.height,
        'width': this.size_.width,
        'stroke': this.opt_color_,
        'fill': this.opt_color_,

    }, this.fieldGroup_);

    this.createTextElement_();
}; 

CustomFields.eventparam.prototype.flydownBlocksXML_ = function () {
    // TODO: Refactor this to use getValue() instead of getText(). getText()
    //   refers to the view, while getValue refers to the model (in MVC terms).

    var name = this.getText();
    var getterSetterXML =
        '<xml>' +
        '<block type="event_params_player"></block>' +
        '</xml>';
    return getterSetterXML;
}
'use strict';

goog.provide('AI.Blockly.Flydown');

goog.require('Blockly.VerticalFlyout');
goog.require('Blockly.Block');
goog.require('Blockly.Comment');

/**
 * Class for a flydown.
 * @constructor
 */
Blockly.Flydown = function(workspaceOptions) {
  Blockly.Flydown.superClass_.constructor.call(this, workspaceOptions);
  this.dragAngleRange_ = 360;
};
Blockly.utils.object.inherits(Blockly.Flydown, Blockly.VerticalFlyout);

/**
 * Previous CSS class for this flydown
 * @type {number}
 * @const
 */
Blockly.Flydown.prototype.previousCSSClassName_ = '';

/**
 * Override flyout factor to be smaller for flydowns
 * @type {number}
 * @const
 */
Blockly.Flydown.prototype.VERTICAL_SEPARATION_FACTOR = 1;

/**
 * Creates the flydown's DOM.  Only needs to be called once.  Overrides the flyout createDom method.
 * @param {!String} cssClassName The name of the CSS class for this flydown. 
 * @return {!Element} The flydown's SVG group.
 */
Blockly.Flydown.prototype.createDom = function(cssClassName, backgroundCOLOR) {
  /*
  <g>
    <path class={cssClassName}/>
    <g></g>
  </g>
  */
  this.previousCSSClassName_ = cssClassName; // Remember class name for later
  this.svgGroup_ = Blockly.utils.dom.createSvgElement('g', {'class': cssClassName}, null);
  this.svgBackground_ = Blockly.utils.dom.createSvgElement('path', {
    'stroke': backgroundCOLOR,
    'fill': backgroundCOLOR}, this.svgGroup_);
  this.svgGroup_.appendChild(this.workspace_.createDom());
  return this.svgGroup_;
};

/**
 * Set the CSS class of the flydown SVG group. Need to remove previous class if there is one.
 * @param {!String} newCSSClassName The name of the new CSS class replacing the old one
 */
Blockly.Flydown.prototype.setCSSClass = function(newCSSClassName) {
  if (newCSSClassName !== this.previousCSSClassName_) {
    Blockly.utils.dom.removeClass(this.svgGroup_, this.previousCSSClassName_);
    Blockly.utils.dom.addClass(this.svgGroup_, newCSSClassName);
    this.previousCSSClassName_ = newCSSClassName;
  }
}

/**
 * Initializes the Flydown.
 * @param {!Blockly.Workspace} workspace The workspace in which to create new
 *     blocks.
 */
Blockly.Flydown.prototype.init = function(workspace) {
  Blockly.VerticalFlyout.prototype.init.call(this, workspace, false); // Flydowns have no scrollbar
}

/**
 * Override the flyout position method to do nothing instead
 * @private
 */
Blockly.Flydown.prototype.position = function() {
  return;
}

/**
 * Show and populate the flydown.
 * @param {!Array|string} xmlList List of blocks to show.
 * @param {!num} x x-position of upper-left corner of flydown
 * @param {!num} y y-position of upper-left corner of flydown
 */
Blockly.Flydown.prototype.showAt = function(xmlList,x,y) {
  Blockly.Events.disable();
  try {
    this.show(xmlList); // invoke flyout method, which adds blocks to flydown and calculates width and height.
  } finally {
    Blockly.Events.enable();
  }
  // this.svgGroup_.setAttribute('transform', 'translate(' + x + ',' + y + ')');
  // Calculate path around flydown blocks. Based on code in flyout position_ method.

  // Start at bottom of top left arc and proceed clockwise
  // Flydown outline shape is symmetric about vertical axis, so no need to differentiate LTR and RTL paths.
  var margin = this.CORNER_RADIUS * this.workspace_.scale;
  var edgeWidth = this.width_ - 2*margin;
  var edgeHeight = this.height_ - 2*margin;


  var path = ['M 0,' + margin];
  path.push('a', margin, margin, 0, 0, 1, margin, -margin); // upper left arc
  path.push('h', edgeWidth);  // top edge
  path.push('a', margin, margin, 0, 0, 1, margin, margin); // upper right arc
  path.push('v', edgeHeight); // right edge
  path.push('a', margin, margin, 0, 0, 1, -margin, margin); // bottom right arc
  path.push('h', -edgeWidth); // bottom edge, drawn backwards
  path.push('a', margin, margin, 0, 0, 1, -margin, -margin); // bottom left arc
  path.push('z'); // complete path by drawing left edge
  this.svgBackground_.setAttribute('d', path.join(' '));
  this.svgGroup_.setAttribute('transform', 'translate(' + x + ', ' + y + ')');
}

/**
 * Compute width and height of Flydown.  Position button under each block.
 * Overrides the reflow method of flyout
 * For RTL: Lay out the blocks right-aligned.
 */
Blockly.Flydown.prototype.reflow = function() {
  this.workspace_.scale = this.targetWorkspace_.scale;
  var scale = this.workspace_.scale;
  var flydownWidth = 0;
  var flydownHeight = 0;
  var margin = this.CORNER_RADIUS * scale;
  var blocks = this.workspace_.getTopBlocks(false);
  for (var i = 0, block; block = blocks[i]; i++) {
    var root = block.getSvgRoot();
    var blockHW = block.getHeightWidth();
    flydownWidth = Math.max(flydownWidth, blockHW.width * scale);
    flydownHeight += blockHW.height * scale;

  }
  var constantes = this.targetWorkspace_.getRenderer().getConstants();

  flydownWidth += 2 * margin + constantes.TAB_WIDTH * scale; // TAB_WIDTH is with of plug
  flydownHeight += 2 * margin + margin * this.VERTICAL_SEPARATION_FACTOR * (blocks.length - 1) + constantes.START_HAT_HEIGHT*scale/2.0;


  if (this.width_ != flydownWidth) {
    for (var j = 0, block; block = blocks[j]; j++) {
      var blockHW = block.getHeightWidth();
      var blockXY = block.getRelativeToSurfaceXY();
      if (this.RTL) {
        // With the FlydownWidth known, right-align the blocks.
        var dx = flydownWidth - margin - scale * (constantes.TAB_WIDTH - blockXY.x);
        block.moveBy(dx, 0);
        blockXY.x += dx;
      }
      if (block.flyoutRect_) {
        block.flyoutRect_.setAttribute('width', blockHW.width);
        block.flyoutRect_.setAttribute('height', blockHW.height);
        block.flyoutRect_.setAttribute('x',
            this.RTL ? blockXY.x - blockHW.width : blockXY.x);
        block.flyoutRect_.setAttribute('y', blockXY.y);
      }
    }
    // Record the width for us in showAt method

    this.width_ = flydownWidth;
    this.height_ = flydownHeight;
  }
};

Blockly.Flydown.prototype.onMouseMove_ = function(e) {
  // override Blockly's flyout behavior for moving the flyout.
  return;
};

Blockly.Flydown.prototype.getX = function () {
  return 0;
};

/**
 * Copy a block from the flyout to the workspace and position it correctly.
 * @param {!Blockly.Block} originBlock The flyout block to copy..
 * @return {!Blockly.Block} The new block in the main workspace.
 * @private
 */
Blockly.Flydown.prototype.placeNewBlock_ = function(originBlock) {
  var targetWorkspace = this.targetWorkspace_;
  var svgRootOld = originBlock.getSvgRoot();
  if (!svgRootOld) {
    throw 'originBlock is not rendered.';
  }
  // Figure out where the original block is on the screen, relative to the upper
  // left corner of the main workspace.
  var scale = this.workspace_.scale;
  var margin = this.CORNER_RADIUS * scale;
  var xyOld = this.workspace_.getSvgXY(svgRootOld);
  //var scrollX = this.svgGroup_.getScreenCTM().e + margin;
  var scrollX = xyOld.x;
  xyOld.x += scrollX / targetWorkspace.scale - scrollX;
  //var scrollY = this.svgGroup_.getScreenCTM().f + margin;
  var scrollY = xyOld.y;
  scale = targetWorkspace.scale;
  xyOld.y += scrollY / scale - scrollY;

  // Create the new block by cloning the block in the flyout (via XML).
  var xml = Blockly.Xml.blockToDom(originBlock);
  var block = Blockly.Xml.domToBlock(xml, targetWorkspace);
  var svgRootNew = block.getSvgRoot();
  if (!svgRootNew) {
    throw 'block is not rendered.';
  }
  // Figure out where the new block got placed on the screen, relative to the
  // upper left corner of the workspace.  This may not be the same as the
  // original block because the flyout's origin may not be the same as the
  // main workspace's origin.
  var xyNew = targetWorkspace.getSvgXY(svgRootNew);
  // Scale the scroll (getSvgXY did not do this).
  xyNew.x +=
      targetWorkspace.scrollX / targetWorkspace.scale - targetWorkspace.scrollX;
  xyNew.y +=
      targetWorkspace.scrollY / targetWorkspace.scale - targetWorkspace.scrollY;
  // If the flyout is collapsible and the workspace can't be scrolled.
  if (targetWorkspace.toolbox_ && !targetWorkspace.scrollbar) {
    xyNew.x += targetWorkspace.toolbox_.getWidth() / targetWorkspace.scale;
    xyNew.y += targetWorkspace.toolbox_.getHeight() / targetWorkspace.scale;
  }

  // Move the new block to where the old block is.
  block.moveBy(xyOld.x - xyNew.x, xyOld.y - xyNew.y);
  return block;
};

Blockly.Flydown.prototype.shouldHide = true;

Blockly.Flydown.prototype.hide = function() {
  if (this.shouldHide) {
    Blockly.VerticalFlyout.prototype.hide.call(this);
    CustomFields.eventparam.openFieldFlydown_ = null;
  }
  this.shouldHide = true;
}
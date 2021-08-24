
# Blockly-Flydown
Blockly flydown is a field system that lets you hover your mouse over it to open a gui, where you can put any block in it, and can be transferred to the main workspace. (**This code does not need any dependency other than Blockly and closure**)

This one could be created from [appinventor](https://github.com/mit-cml/appinventor-sources), and with the participation of the following authors:
- [Lyn Turbak](fturbak@wellesley.edu) (AppInventor)
- Pigeonmal
- [Beka Westberg](http://bekawestberg.me/)
- Abby Schmiedt

> Example :
> 
> ![enter image description
> here](https://media.discordapp.net/attachments/533339036777971723/879752511345537125/blockly.PNG)

 
## INSTALATION

First, add the two files **custom_fields.js** and **custom_flydown.js** and don't forget to implement them in your head in index.html:

    <script  src="custom_flydown.js"></script>
    <script  src="custom_fields.js"></script>

Then in your Blockly /core/ folder, you will have a file called flyout_base.js, replace it with the one above.

## CONFIGURATION
### PART 1 :
After your 
> var workspace = Blockly.inject(...)

 add this :

    var  flydown = new  Blockly.Flydown(new Blockly.Options({scrollbars:  false }));
    
    workspace.flydown_ = flydown;
    
    Blockly.utils.dom.insertAfter(flydown.createDom('g', '#fff'), workspace.svgBubbleCanvas_);
If you want to renderer do that (exemple zelos):

    new Blockly.Options({renderer:  'zelos', scrollbars:  false}
    
Or if you want change background color of the flydown do that (exemple rgb blue transparent 0.5):

    flydown.createDom('g', 'rgba(52, 152, 219, 0.5)')

### PART 2:
In your custom block, exemple :

    Blockly.Blocks['test_block'] = {
    	init:  function() {
	    this.appendDummyInput()
	    .appendField(new  CustomFields.eventparam('CUSTOM_NAME', '#3498db', workspace));
       }
    };
And of course you can change the color (rbg, hexa, ...)
### PART 3:
In **custom_fields.js** you can change the return xml and add your custom blocks, in the function **flydownBlocksXML_**.

    CustomFields.eventparam.prototype.flydownBlocksXML_ = function () {
		    var  name = this.getText();
		    
		    var  getterSetterXML =
		    '<xml>' +
		    '<block type="event_params_player"></block>' +
		    '</xml>';
		    
		    return  getterSetterXML;
    }

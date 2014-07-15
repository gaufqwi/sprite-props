$(function () {
    var sprites = [], properties = {}, curSprite = null, autoNumber = true;
    var changes = {set: {}, rename: {}, delete: [] };
    var naming = [{type: 'lit', value: '', kase: 'toMixedCase'}], uuid = 0;
    var dialog;
    
    // Test data
    properties = {material: [], color: ['red', 'green', 'blue'], size: []};
    
    // Monkey patch
    String.prototype.toMixedCase = function () {
        return this.charAt(0).toUpperCase() + this.slice(1);
    };
    
    function dbg(ob) {
        console.log(JSON.stringify(ob, null, " "));
    }
    
    function displaySpriteProperties (sprite) {
        var ul = $('#proppanel ul');
       
        ul.empty();
        if (sprite === null) {
            $('#spritename').empty();
            $('#spritefilename').empty();
        } else {
            $('#spritename').html(sprite.name);
            $('#spritefilename').html(sprite.filename);
           
            for (var prop in sprite.userdata) {
                ul.append('<li><span class="propstyle">' + prop + ':</span> ' 
                    + sprite.userdata[prop] + '</li>');
           }
        }
    }
    
    function applyPropertyChanges () {
        var i, j, prop, sprite;
        
        for (i=0; i<sprites.length; i++) {
            sprite = sprites[i];
            if (!sprite.selected) {
                continue;
            }
            // Set properties
            for (prop in changes.set) {
                sprite.userdata[prop] = changes.set[prop];
            }
           // Delete properties
           for (j=0; j<changes.delete.length; j++) {
               delete sprite.userdata[changes.delete[j]];
               delete changes.rename[changes.delete[j]];
           }
           // Rename properties
           for (prop in changes.rename) {
               sprite.userdata[changes.rename[prop]] = sprite.userdata[prop];
               delete sprite.userdata[prop];
           }
        }
           
           changes = {set: {}, rename: {}, delete: [] };
           updatePropEditor();
    }
    
    function generateSpriteNames () {
        var i, j, sprite, spritesCopy, namespec, nameCounts = {};
        // Slot in name stubs
        for (i=0; i<sprites.length; i++) {
            sprite = sprites[i];
            sprite.name = '';
            for (j=0; j<naming.length; j++) {
                namespec = naming[j];
                if (namespec.type === 'lit') {
                    dbg(namespec);
                    sprite.name = sprite.name + namespec.value[namespec.kase]();
                } else if (namespec.type === 'prop' && 
                    (namespec.value in sprite.userdata)) {
                        sprite.name = sprite.name
                            + sprite.userdata[namespec.value][namespec.kase]();
                } else if (namespec.type === 'ext') {
                    sprite.name = sprite.name + sprite.ext[namespec.kase]();
                }
            }
            // Fallback
            if (sprite.name === '') {
                sprite.name = 'sprite';
            }
            nameCounts[sprite.name] = (nameCounts[sprite.name] || 0) + 1;
        }
        // Add numbers to disambiguate
        if (autoNumber) {
            spritesCopy = sprites.slice();
            spritesCopy.sort( function (a, b) {
                if (a.name < b.name) {
                    return -1;
                } else if (a.name > b.name) {
                    return 1;
                }
                return 0;
            });
            j = 1;
            for (i=0; i<spritesCopy.length; i++) {
                sprite = spritesCopy[i];
                if (nameCounts[sprite.name] === 1) {
                    continue;
                } else if (j === nameCounts[sprite.name]) {
                    sprite.name = sprite.name + j;
                    j = 1;
                } else {
                    sprite.name = sprite.name + j;
                    j += 1;
                }
            }
        }
    }
    
    function propertyNameUnused (name) {
        var prop;
        // Property is used and hasn't been changed
        for (prop in properties) {
            if (name === prop && !changes.rename[prop]) {
                return false;
            }
        }
        // Property is unused and something has been changed to it
        for (prop in changes.rename) {
            if (name === changes.rename[prop]) {
                return false;
            }
        }
        return true;
    }
    
    function addToGallery (file) {
        var div, img, obj = {};
        
        img = $('<img>', {src: URL.createObjectURL(file), //width: 64,
            class: 'sprite',
            onload: function () {URL.revokeObjectURL(this.src);}
        });
        
        div = $('<div>', {class: 'spritecell'});
        
        div.append(img);
        div.append('<span class="filename">' + file.name + '</span>');
        
        obj.filename = file.name;
        obj.ext = obj.filename.split('.').slice(-1);
        if (obj.ext.length === obj.filename.length) {
            obj.ext = '';
        }
        obj.div = div;
        obj.selected = false;
        obj.userdata = {};
        sprites.push(obj);
        
        $('#icongallery').append(div);
    }
    
    function redrawGallery () {
        $('#icongallery div').detach();
        for (var i=0; i<sprites.length; i++) {
            $('#icongallery').append(sprites[i].div);
        }
    }
    
    function appendNameRow (pos) {
        var div, span, rows = $('#nameset .namesetrow');
        
        pos = pos || 0;
        uuid += 1;          // Cheap, but it's fine here
        
        div = $('<div class="namesetrow">');
        if (pos >= rows.length) {
            div.appendTo('#nameset');
        } else {
            div.insertAfter(rows.eq(pos))
        }
        pos = div.index();
        
        span = $('<span class="movebuttons">');
        $('<button class="moveup">Sort Asc</button>')
            .button({text: false, icons: {primary: 'ui-icon-triangle-1-n'}})
            .appendTo(span);
        $('<button class="movedown">Sort Des</button>')
            .button({text: false, icons: {primary: 'ui-icon-triangle-1-s'}})
            .appendTo(span);
        span.buttonset();
        span.appendTo(div);
        
        $('<select class="nametype">')
            .append('<option value="prop">Property</option>')
            .append('<option value="lit">Literal</option>')
            .append('<option value="ext">Extension</option>')
            .appendTo(div)
            .selectmenu({width: 100});
        
        $('<span class="casebuttons">')
            .append('<input type="radio" value="toMixedCase" id="case'
                + uuid + 'M" name="case' + uuid + '" checked>')
            .append('<label for="case' + uuid + 'M">Ab</label>')
            .append('<input type="radio" value="toUpperCase" id="case'
                + uuid + 'U" name="case' + uuid + '">')
            .append('<label for="case' + uuid + 'U">AB</label>')
            .append('<input type="radio" value="toLowerCase" id="case'
                + uuid + 'L" name="case' + uuid + '">')
            .append('<label for="case' + uuid + 'L">ab</label>')
            .buttonset()
            .appendTo(div);

        $('<input class="nameinput" size="10">').appendTo(div);
            
        $('<button class="addname">Add</button>')
            .button({text: false, icons: {primary: 'ui-icon-plus'}})
            .appendTo(div);
            
        $('<button class="remname">Remove</button>')
            .button({text: false, icons: {primary: 'ui-icon-minus'}})
            .appendTo(div);

        // Special case stuff for first element
        if (rows.length === 0) {
            div.find('select').val('lit').selectmenu('refresh');
        }
            //div.find('.remname').prop('disabled', true);
        // } else {
        //     $('#nameset .remname').prop('disabled', false);
        // }
    }
    
    function appendProperty (name, values) {
        var div, span, i;
        
        div = $('<div class="propertysetrow">').data('property', name);
        $('#propset .centerdiv').before(div);
        i = div.index();
        
        span = $('<span class="sortbuttons">');
        $('<button class="sortup">Sort Asc</button>')
            .button({text: false, icons: {primary: 'ui-icon-arrow-1-n'}})
            .appendTo(span);
        $('<button class="sortdown">Sort Des</button>')
            .button({text: false, icons: {primary: 'ui-icon-arrow-1-s'}})
            .appendTo(span);
        span.buttonset();
        span.appendTo(div);
        
        $('<input type="checkbox" class="deleteprop" id="dp' + i + '">')
            .appendTo(div)
            .after('<label for="dp' + i + '">Delete</label>');
        div.children('.deleteprop').button({text: false, icons: {primary: 'ui-icon-trash'}});

        $('<button class="renameprop">Rename</button>')
            .button({text: false, icons: {primary: 'ui-icon-pencil'}})
            .appendTo(div);
            
        $('<span class="propsetname propstyle">' + name + '</span> ')
            .appendTo(div);
            
        $('<input class="propinput" size="12">')
            .autocomplete({source: values})
            .appendTo(div);

    }
    
    function updatePropEditor () {
        $('#propset .propertysetrow').remove();
        for (var prop in properties) {
            appendProperty(prop, properties[prop]);
        }
    }

    // Setup basic JQ UI stuff
    //$('.tabs').tabs();
    $('#applyprop').button({icons: {primary: 'ui-icon-check'}});
    $('#autonumber').button({icons: {primary: 'ui-icon-tag'}})
        .prop('checked', true).button('refresh');
    $('#addprop').button({icons: {primary: 'ui-icon-circle-plus'}});
    $('#addname').button({icons: {primary: 'ui-icon-circle-plus'}});
    dialog =$('#propnamedialog').dialog(
        {autoOpen: false, width: 350, height: 300, modal: true});
    
    // Event handlers ////////////

    
    // New or rename property
    function nameButtonHandler (e) {
        // var buttons = {'Cancel': function () {
        //     dialog.dialog('close');
        // }};
        var buttons = {}, row, oldprop, dispprop;
        $('#propnamedialog .errmsg').empty();
        if (e.data === 'new') {
            // New property
            $('#newpropname').val('');
            buttons['Add Property'] = function () {
                var prop = $('#newpropname').val();
                if (propertyNameUnused(prop)) {
                    appendProperty(prop, []);
                    dialog.dialog('close');
                } else {
                    $('#propnamedialog .errmsg').html("There is already a property with that name.");
                }
            };
            dialog.dialog('option', {title: 'New Property', buttons: buttons});
        } else {
            // Rename property
            row = $(this).parents('.propertysetrow');
            oldprop = row.data('property');
            dispprop = changes.rename[oldprop] || oldprop;
            $('#newpropname').val(dispprop);
            buttons['Rename Property'] = function () {
                var prop = $('#newpropname').val();
                if (prop === dispprop) {
                    dialog.dialog('close');
                } else if (propertyNameUnused(prop)) {
                    if (prop === oldprop) {
                        delete changes.rename[oldprop];
                    } else {
                        changes.rename[oldprop] = prop;
                    }
                    row.children('.propsetname')
                        .html(prop);
                    dbg(changes);
                    dialog.dialog('close');
                } else {
                    $('#propnamedialog .errmsg').html("There is already a property with that name.");
                }
            };
            dialog.dialog('option', {title: 'Rename Property', buttons: buttons});
        }
        dialog.dialog('open');
    }
    $('#addprop').on('click', null, 'new', nameButtonHandler);
    $('#propset').on('click', '.renameprop', 'rename', nameButtonHandler);
    
    // Turn on/off auto numbering
    $('#autonumber').on('change', function () {
        autoNumber = this.checked;
        generateSpriteNames();
        displaySpriteProperties(curSprite);
    })
    
    // Handle (un)deletes
    $('#propset').on('change', '.deleteprop', function () {
        var i, row = $(this).parents('.propertysetrow'), prop = row.data('property');
        if (this.checked) {
            changes.delete.push(prop);
            row.children('.propinput').prop('disabled', true);
            row.children('.propsetname').toggleClass('deleted', true);
        } else {
            i = changes.delete.indexOf(prop);
            changes.delete.splice(i, 1);
            row.children('.propinput').prop('disabled', false);
            row.children('.propsetname').toggleClass('deleted', false);
        }
    });
    
    // Update property view
    $('#icongallery').on('mouseenter', '.spritecell', function () {
        curSprite = sprites[$(this).index()];
        
        displaySpriteProperties(curSprite);
       
    });
    
    // Sort gallery
    function sortHandler (e) {
        var prop = $(this).parents('.propertysetrow').data('property');
        console.log(prop, e.data);
        sprites.sort(function (a, b) {
            if (a.userdata[prop] < b.userdata[prop]) {
                return -1*e.data;
            } else if (a.userdata[prop] > b.userdata[prop]) {
                return 1*e.data;
            }
            return 0;
        });
        redrawGallery();
    }
    $('#propset').on('click', '.sortup', 1, sortHandler);
    $('#propset').on('click', '.sortdown', -1, sortHandler);
    
    // Apply property changes
    $('#applyprop').on('click', applyPropertyChanges);
    
    // Handle property edits
    $("#propset").on('input autocompleteselect', '.propinput', function (e, ui) {
        var val, prop = $(this).parent().data('property');
        if (ui) {
            val = ui.item.label;
        }   else {
            val = $(this).val();
        }
        if (val === '') {
            delete changes.set[prop];
        }  else if (!changes.set[prop] || changes.set[prop] !== val) {
            changes.set[prop] = val;
        }
    });
    
    // Select sprites
    $('#icongallery').on('click', '.spritecell', function (e) {
        var $this = $(this), i = $this.index();
        $this.toggleClass('hilite');
        sprites[i].selected = !(sprites[i].selected);
    });
    
    // Name box ////////////////////////
    
    // Add name row
    $('#nameset').on('click', '.addname', function () {
        var pos = $(this).parents('.namesetrow').index();
        appendNameRow(pos);
        naming.splice(pos+1, 0, {type: 'prop', value: '', kase: 'toMixedCase'});
        generateSpriteNames();
        displaySpriteProperties(curSprite);
    });
    
    // Remove name row
    $('#nameset').on('click', '.remname', function () {
        var row = $(this).parents('.namesetrow'), pos = row.index();
        // Don't delete last row
        if ($('#nameset .namesetrow').length === 1) {
            return;
        }
        row.remove();
        naming.splice(pos, 0);
        generateSpriteNames();
        displaySpriteProperties(curSprite);
        // if ($('#nameset .namesetrow').length === 1) {
        //     $('#nameset .remname').prop('disabled', true);
        // }
    });
    
    // Move row up
    $('#nameset').on('click', '.moveup', function () {
        var row = $(this).parents('.namesetrow'), prev = row.prev();
        var pos = row.index();
        if (prev.length > 0) {
            row.detach();
            prev.before(row);
            naming.splice(pos-1, 0, naming.splice(pos, 1)[0]);
        }
        generateSpriteNames();
        displaySpriteProperties(curSprite);
    });
    
    // Move row down
    $('#nameset').on('click', '.movedown', function () {
        var row = $(this).parents('.namesetrow'), next = row.next();
        var pos = row.index();
        if (next.length > 0) {
            row.detach();
            next.after(row);
            naming.splice(pos, 0, naming.splice(pos, 1)[0]);
        }
        generateSpriteNames();
        displaySpriteProperties(curSprite);
    });
    
    // Edit name field
    $('#nameset').on('input', '.nameinput', function () {
        var row = $(this).parents('.namesetrow'), pos = row.index();
        var val = $(this).val();
        naming[pos].value = val;
        generateSpriteNames();
        displaySpriteProperties(curSprite);
    });
    
    // Change field type
    $('#nameset').on('selectmenuchange', '.nametype', function () {
        var row = $(this).parents('.namesetrow'), pos = row.index();
        var val = $(this).val();
        naming[pos].type = val;
        generateSpriteNames();
        displaySpriteProperties(curSprite);
    });
    
    // Case button change
    $('#nameset').on('change', '.casebuttons', function () {
        var row = $(this).parents('.namesetrow'), pos = row.index();
        var val = $(this).find(':checked').val();
        naming[pos].kase = val;
        generateSpriteNames();
        displaySpriteProperties(curSprite);
    });
    
    // Set up data
    updatePropEditor();
    appendNameRow(); // FIXME

    // Drag and drop stuff /////////////
    
    $('#icongallery').on('dragenter', function (e) {
        e.stopPropagation();
        e.preventDefault();
        
        //$(this).css('border', '2px solid red');
        
    });
    
    $('#icongallery').on('dragover', function (e) {
        e.stopPropagation();
        e.preventDefault();
    });
    
    $('#icongallery').on('drop', function (e) {
        var files, img;
        
        e.preventDefault();
        
        files = e.originalEvent.dataTransfer.files;
        for (var i=0; i<files.length; i++) {
            // FIXME: Check type
            addToGallery(files[i]);
        }
        generateSpriteNames();
   });
   
    $(document).on('dragenter', function (e) {
        e.stopPropagation();
        e.preventDefault();
    });
    
    $(document).on('dragover', function (e) {
        e.stopPropagation();
        e.preventDefault();
        //$('#droptarget').css('border', '1px dotted black');
    });
    
    $(document).on('drop', function (e) {
        e.stopPropagation();
        e.preventDefault();
    });
});
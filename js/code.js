$(function () {
    var sprites = [], properties = {};
    var changes = {set: {}, rename: {}, delete: [] };
    var dialog;
    
    // Test data
    properties = {material: [], color: ['red', 'green', 'blue'], size: []};
    
    function dbg(ob) {
        console.log(JSON.stringify(ob, null, " "));
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
    
    function appendProperty (name, values) {
        var div, span, i;
        
        div = $('<div class="propertysetrow">').data('property', name);
        $('#buttondiv').before(div);
        i = div.index();
        
        span = $('<span class="sortbuttons">');
        $('<button class="sortup">Sort Asc</button>')
            .button({text: false, icons: {primary: 'ui-icon-triangle-1-n'}})
            .appendTo(span);
        $('<button class="sortdown">Sort Des</button>')
            .button({text: false, icons: {primary: 'ui-icon-triangle-1-s'}})
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
            
        $('<input class="propinput" size="8">')
            .autocomplete({source: values})
            .appendTo(div);
            
        //$('#buttondiv').before(div);
        
    }
    
    function updatePropEditor () {
        $('#propset .propertysetrow').remove();
        for (var prop in properties) {
            appendProperty(prop, properties[prop]);
        }
        
        // FIXME: Add button
    }

    // Setup basic JQ UI stuff
    //$('.tabs').tabs();
    $('#applyprop').button({icons: {primary: 'ui-icon-check'}});
    $('#addprop').button({icons: {primary: 'ui-icon-circle-plus'}});
    dialog =$('#propnamedialog').dialog(
        {autoOpen: false, width: 350, height: 300, modal: true});
    
    // Event handlers
    // $('#configtabs').tabs({beforeActivate: function (e, ui) {
    //     if (ui.newPanel.is('#propertiestab')) {
            
    //     }
    // }});
    
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
    $('#icongallery').on('mouseover', 'spritecell', function () {
       var sprites[$(this).index()];
       var ul = $('#proppanel ul');
       
       $('#spritefilename').html(sprite.filename);
       
       ul.empty();
       
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
    $('#applyprop').on('click', function () {
        var i, prop;
        
        for (i=0; i<sprites.length; i++) {
            if (!sprites[i].selected) {
                continue;
            }
            // Set properties
            for (prop in changes.set) {
                sprites[i].userdata[prop] = changes.set[prop];
            }
           // Rename properties
           // Delete properties
        }
        
        // Update properties map
        
        updatePropEditor();
        console.log(JSON.stringify(sprites, null, ' '));
    });
    
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
    
    // Set up data
    // updatePropertySetters();
    // updatePropertyEditors();
    updatePropEditor();

    // Drag and drop stuff
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
$(function () {
    var sprites = [], properties = {};
    
    // Test data
    properties = {material: [], color: ['red', 'green', 'blue'], size: []};
    
    function addToGallery (file) {
        var div, img, obj = {};
        
        img = $('<img>', {src: URL.createObjectURL(file), width: 64,
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
        $('#icongallery').empty();
    }
    
    function updatePropertySetters () {
        var k;
        
        $('#propset').empty();
        for (k in properties) {
            addPropertySetter(k, properties[k]);
        }
    }
    
    function addPropertySetter (prop, options) {
        var div = $('<div class="propertysetter">');
        
        div.append('<span>' + prop + '</span>');
        div.append('<input size="8">');
        
        $('#propset').append(div);
    }
    
    function updatePropertyEditors () {
        $('#propertiestab').empty();
        for (k in properties) {
            addPropertyEditor(k, properties[k]);
        }
    }
    
    function addPropertyEditor (prop, options) {
        var div = $('<div class="propertyeditor">');
        
        div.append($('<button class="sortdown">').button({text: false,
            icons: {primary: 'ui-icon-triangle-1-s'}
        }));
        div.append($('<button class="sortup">').button({text: false,
            icons: {primary: 'ui-icon-triangle-1-n'}
        }));
        div.append($('<button class="remove">').button({text: false,
            icons: {primary: 'ui-icon-circle-minus'}
        }));
        
        div.append('<span>' + prop + ':</span>');
        div.append(' ' + options.join(', '));
        
        $('#propertiestab').append(div);
    }
    
    // Setup basic JQ UI stuff
    //$('.tabs').tabs();
    
    // Event handlers
    // $('#configtabs').tabs({beforeActivate: function (e, ui) {
    //     if (ui.newPanel.is('#propertiestab')) {
            
    //     }
    // }});
    
    $('#icongallery').on('click', '.spritecell', function (e) {
        var $this = $(this), i = $this.index();
        $this.toggleClass('hilite');
        sprites[i].selected = !(sprites[i].selected);
        console.log(JSON.stringify(sprites));
    });
    
    // Set up data
    // updatePropertySetters();
    // updatePropertyEditors();
    
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
sap.ui.define(["sap/ui/base/Object"], function (Object) {
    const BaseObject = Object.extend("com.bayer.tender.statenderapp.model.BaseObject", {
        constructor: function() {
            Object.prototype.constructor.call(this);
            this.busy = false;
            this.busy = false;
        },
        setBusy: function(busy) {
            this.busy = busy;
        },
        convertToPascalCase: function(strValue) {
            return strValue.replace(/\s/g, '').replace(/(?:^\w|[A-Z]|\b\w)/g, function(match) {
                return match.toUpperCase();
            });    
        },

        convertToUpperCamelCase: function(str) {
            if (str === str.toUpperCase()) {
                return str.charAt(0) + str.slice(1).toLowerCase();
            }
            
            return str
                .replace(/[-_](.)/g, (_, char) => char.toUpperCase())
                .replace(/^(.)/, (_, char) => char.toUpperCase());
        }
    });
    return BaseObject;
});
sap.ui.define(["sap/ui/base/Object"], function (Object) {
    const BaseObject = Object.extend("com.bayer.tender.statenderapp.model.BaseObject", {
        constructor: function() {
            Object.prototype.constructor.call(this);
            this.busy = false;
            this.busy = false;
        },
        setBusy: function(busy) {
            this.busy = busy;
        }
    });
    return BaseObject;
});
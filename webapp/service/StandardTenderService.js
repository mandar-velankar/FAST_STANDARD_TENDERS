sap.ui.define(["sap/ui/base/Object"], function (Object) {

    return Object.extend("com.bayer.tender.statenderapp.service.StandardTenderService", {
        constructor: function (model) {
            Object.prototype.constructor.call(this);
            this.model = model;
        },

        createAwardCriteria: function (oAwardCriteriaToSave) {

            //path of offer that is selected
            var sPath = "/PT_TMAWRDCR";

            //Create
            return this.odata(sPath).post(oAwardCriteriaToSave);

        },

        //create new Award criteria based upon array
        createAllAwardCriteria: function (aAwardCriteriaToSave) {

            //array of promises
            let promises = [];
            
            //that is this
            var that = this;
            
            //when award criteria exist
            if (aAwardCriteriaToSave && aAwardCriteriaToSave.length > 0) {

                //loop at each award criteria and put it into the batch
                aAwardCriteriaToSave.forEach(function (oAwardCriteria, iIndex) {

                    //convert award criteria to save, with new tenderID
                    var oAwardCriteriaToSave = that.getConvertAwardCriteriaToSave(oAwardCriteria);

                    //add awardcriteria to save 1 by 1 as a batch
                    promises.push(that.createAwardCriteria(oAwardCriteriaToSave).catch(function (oError) {
                        //show error message
                        Services.showErrorMessage(oError, "Saving of new AwardCriteria");
                        throw new Error(oError);
                    }));

                });

            }

            //if all promises pushed from the loop have received their answer
            return Promise.all(promises).then((result) => {

                //resolve success
                return result;

            }).catch(function (oError) {

                //reject
                return oError;

            });

        },

        //update existing award criteria
        updateAwardCriteria: function (oAwardCriteriaToSave) {


            //path of offer that is selected
            var sPath = this.model.createKey("/PT_TMAWRDCR", {
                TENDERID: oAwardCriteriaToSave.TENDERID,
                Active: oAwardCriteriaToSave.Active,
                AwardCriteria: oAwardCriteriaToSave.AwardCriteria
            });

            //Update
            return this.odata(sPath).put(oAwardCriteriaToSave);

        },
        
        //removing award criteria
        removeAwardCriteria: function (oAwardCriteriaToRemove) {
            
            //path of offer that is selected
            var sPath = this.model.createKey("/PT_TMAWRDCR", {
                TENDERID: oAwardCriteriaToRemove.TENDERID,
                Active: oAwardCriteriaToRemove.Active,
                AwardCriteria: oAwardCriteriaToRemove.AwardCriteria
            });

            //remove
            return new Promise(function (resolve, reject) {

                this.model.remove(sPath, {
                    success: function (oData, oResponse) {

                        //resolve success
                        resolve(oData);

                    },
                    error: function (oError) {

                        //show error message
                        Services.showErrorMessage(oError, "Removing of AwardCriteria");

                        //reject
                        reject(oError);
                    }
                });
            });
        },
        
        //AwardCriteria to save
        getConvertAwardCriteriaToSave: function (oAwardCriteriaSaveInfo) {

            //Convert odata to structure that can be used to save
            var oAwardCriteriaToSave = {};

            oAwardCriteriaToSave.TENDERID = oAwardCriteriaSaveInfo.TENDERID;
            oAwardCriteriaToSave.COUNTRYCODE = oAwardCriteriaSaveInfo.COUNTRYCODE;
            oAwardCriteriaToSave.SUBMITTEDON = oAwardCriteriaSaveInfo.SUBMITTEDON;
            oAwardCriteriaToSave.Submittedby = oAwardCriteriaSaveInfo.Submittedby;
            oAwardCriteriaToSave.Active = oAwardCriteriaSaveInfo.Active;
            oAwardCriteriaToSave.AwardCriteria = oAwardCriteriaSaveInfo.AwardCriteria;
            oAwardCriteriaToSave.Weight = oAwardCriteriaSaveInfo.Weight;

            return oAwardCriteriaToSave;

        }
    });
        
        
    });
});
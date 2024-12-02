class CalcOwnerWidget {
    constructor(view, polygonLayerService, layerUrl, portalUrl, appId, tableFields, params, map) {

        // save the input parameters
        this.view = view;
        this.polygonLayer = polygonLayerService;
        this.url = layerUrl;
        this.portalUrl = portalUrl;
        this.appId = appId;
        this.tableFields = tableFields;
        this.params = params
        this.map = map


        // saves the boolean which determines if startediting or stopediting is triggered when the widget button is clicked
        this.modeDetermination = true
        //saves the newly selected feature
        this.selectedFeature = null;
        // saves the feature in this variable which was selected before a new feature was selected
        this.lastSelectedFeature = null;
        // needed in the main function to determine if the code block should be triggered which appends the original layer or if it should trigger the code for newly calculated layers
        this.index = 0;
        //saves the current feature table
        this.shownTable = null;
        // saves the DOM Element of the feature table
        this.tableDiv = null
        // layerlist[0] is the original layers, all elements after are the new calculated layers which were calculated in one widget click run
        this.layerList = [];

        // saves the cursor style
        this.defaultCursorStyle = null;
        //needed to controle the while loop in the event watcher that looks out for feature selections
        this.counterToCheckForEvent = false;
        // saves the startEventWatcher promise
        this.watcher
        // saves a returned object from reactiveUtils.watch which holds a method to stop the eventlistener for feature clicks
        this.handle
        // saves the eventhandler that checks the cors of the cursor to pass them to createinfowindow
        this.cursorListener
        //saves the text next to the cursor when edit mode activated
        this.cursorInfoDOMElement
        // saves wether the user clicked with the ctrl key or not
        this.ctrlPressed = false
        // saves the features that intersected with the feature that was clicked before. Needed to calculate a new layer which combines these saved features here and the new features that intersect with the new clicked feature	
        this.intersectingFtsFromFtBefore = null
        // saves the sum of all intersecting features from all intersect operations from the clicked features so far. Is used in the building fct 
        this.currentCombinedFts = []



    }

    init() {
        /** 
         * Called from widgetview everytime the widget is clicked. It determines which actions should be done - so if it should start the editing mode or return from the editing mode back to normal
         */
        if (this.modeDetermination === true) {
            this.startEditing();
            this.modeDetermination = false

        } else {
            this.stopEditing();
            this.modeDetermination = true
        }
    }


    async startEditing() {
        /**
         * This method starts the editing cascade. First, it hides the original layer that is shown in "normal mode" and then it changes the while loop boolean in the event listener so that the startEventWatcher - event listener can start to work. Also it changes the appearance of the cursor and appends a little info text next to the cursor
         */
        this.polygonLayer.visible = false;
        this.counterToCheckForEvent = false;

        this.watcher = await this.startEventWatcher();

        this.createInfoWindow();
        this.changeCursor();
    }

    async stopEditing() {
        /**
         * This methods puts everything back into normal mode. 
         * 1. Shows original layer
         * 2. Removes the event listener
         * 3. Changes cursor appearance and deletes that info text next to it
         * 4. if a feature was selected, it removes that corresponding feature table and deletes all layers
         * 
         */
        this.polygonLayer.visible = true;
        this.handle.remove();
        this.counterToCheckForEvent = true;
        this.undoCursor();
        this.hideInfoWindow()
        if (this.selectedFeature) {
            this.deleteFeatureTable();
            this.deleteNewLayers();
        }
        this.lastSelectedFeature = null
        this.index = 0;
        this.layerList = []

    }


    async startEventWatcher() {
        /**
         * This method starts the Event Listener, which checks every 0.5 seconds if something with the feature selection has changed. 
         * If a feature was selected, it hides the info text at the cursor. Then it checks, if in case, that already a feature was selected, a new feature was actually selected or there was a click on the same feature again. Then it saves that clicked feature into selected feature and the feature which was clicked before into lastfeature var. 
         * In case a new feature was clicked, it triggers the main fct. 
         * The else block contains the case, that a feature was clicked and then unselected, but no no feature was selected. Then it changes back into the "default editing mode" - which means it shows the info cursor window again, removes the feature table from the feature before.
         * In any case, it returns the handle to stop the event listener 
         */


        while (!this.counterToCheckForEvent) {
            // Check for an event every 0.5 seconds
            await new Promise(resolve => setTimeout(resolve, 500));
            // Check if ctrl is pressed


            // Check if the popup of a feature is active
            this.handle = this.params["reactiveUtils"].watch(
                () => this.view.popup.viewModel?.active,
                async () => {

                    // Store the selected feature and check if ctrl is pressed
                    this.selectedFeature = this.view.popup.selectedFeature;
                    this.ctrlPressed = this.listenForCtrlKey()


                    // If a feature was selected and ctrl was not pressed down
                    if (this.selectedFeature !== null) {

                        this.hideInfoWindow();
                        // and if that feature is not the same feature that was selected before that
                        if (this.selectedFeature !== this.lastSelectedFeature) {
                            this.lastSelectedFeature = this.selectedFeature;

                            this.mainFct(this.ctrlKeyPressed);
                        }

                        // if a feature was selected and ctrl was pressed down
                    } else if (this.lastSelectedFeature !== null && this.ctrlKeyPressed === true) {

                        this.mainFct(this.ctrlKeyPressed)
                        // old layer is not deleted

                        // if there is no feature selected anymore
                    } else {
                        // If there is no feature selected anymore but there has been something selected before
                        if (this.lastSelectedFeature !== null) {
                            // put everything to the initial editing mode
                            this.createInfoWindow()
                            this.deleteFeatureTable()

                            // reset saved features
                            this.intersectingFtsFromFtBefore = null
                            this.currentCombinedFts = []

                            // hide all calculated layers but also the original (we want to be in editing mode again)
                            if (this.layerList[0]) {
                                this.deleteNewLayers()
                                this.layerList[0].visible = false;
                            }
                        }
                    }
                }
            );

            return this.handle;
        }
    }

    async stopEventWatcher() {
        /**
         * This method stops the event listener that checks if feature are selected
         */
        this.handle.remove()
    }




    listenForCtrlKey() {
        /**
 * This function listens for the ctrl key being pressed down and released. 
 * It is needed to determine if the ctrl key is pressed down or not 
 * when a feature is selected in the event listener. If it is pressed down, 
 * the selected feature is combined with all other features that were selected
 * before in a new layer. If the ctrl key is not pressed down, the selected
 * feature is considered to be the only feature that will be shown in a new layer.
 * @returns {boolean} returns true, if ctrl key is pressed down, false otherwise 
 */
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Control') {
                this.ctrlKeyPressed = true;
            }
        });

        document.addEventListener('keyup', () => {
            this.ctrlKeyPressed = false;
        });

        return this.ctrlKeyPressed;
    }






    async mainFct(ctrl) {
        /**
     * The main method holds all of the other "sub" - methods. Here the actual functionality of the widget is placed. 
     * 1. Saves the selected feature and the original layer
     * 2. Gets access to the features of that layer and saves all of them unfiltered in a feature set
     * 3. In case there has not been selected any features yet and the widget button is pressed the first time, it adds the originallayer to the layerlist.
     * 4. Checks if there is no error with the access of the features of the original layer and there was a feature selected in the view
     * 5. If so,and the editmode just started (index=0) it makes the geometric calclation in the builder fct and saves its returned output to vars (buildingFct[0] is the returned filtered layer that only contains intersecting features, buildingfct[1] contains the feature table)
     * 6.Then it changes the shown layer to the newly calculated layer
     */


        //get data first:  save the selected feature and the original layer and the featureset (content of layer)// save the selected feature and the original layer and the featureset (content of layer)
        const selectedFt = await this.selectedFeature;
        const lastFeature = await this.lastSelectedFeature;
        const originalLayer = await this.polygonLayer;
        const fts = await this.ftAccess(originalLayer, selectedFt);

        // only if the original layer has not been appended to the layerlist yet, bevause you only want it at index 0 and only once
        if (this.index === 0 && !this.layerList.includes(originalLayer)) {
            this.layerList.push(originalLayer);
        }

        // if ctrl is pressed and there has been a feature selected before and there is a new feature clicked on
        if (ctrl === true && fts && selectedFt && lastFeature) {

            const subMainFctProcess = await this.subMainFctProcess(fts, selectedFt, ctrl)
            // show all layers except the first (the original one)
            for (let i = 1; i < this.layerList.length; i++) {
                this.layerList[i].visible = true;
            }
            this.index += 1;

        }

        // if ctrl is not pressed and a feature is clicked on 
        else if (fts && selectedFt) {
            const subMainFctProcess = await this.subMainFctProcess(fts, selectedFt, ctrl)
            await this.changeShownLayer(this.layerList[this.index], this.layerList[this.index + 1]);
            this.index += 1;
        }
    }


    /**
     * This is a sub method of the main method. 
     * It does the following:
     * 1. If the edit mode was not started before it deletes the feature table
     * 2. Makes the geometric calculation, creates the layer and corresponding feature table
     * 3. Saves the returned layer and feature table to the class
     */
    async subMainFctProcess(fts, selectedFt, ctrl) {
        if (this.index !== 0) {
            // deletes the feature table if this is not the first time the main function is executed in the edit mode (index > 0)
            this.deleteFeatureTable();
        }
        // make the geometric calculation, create the layer and corresponding feature table
        const createTableAndLayer = await this.buildingFct(fts, selectedFt, ctrl);
        const nextLayer = await createTableAndLayer[0];
        // saves the new calculated layer to the layerList
        this.layerList.push(nextLayer);
        // saves the current feature table
        this.shownTable = await createTableAndLayer[1];
    }

    async changeShownLayer(oldLayer, newLayer) {
        /**
         * This method takes the old layer as input and hides it and takes a newLayer input (the newly calculated layer) and shows it in the map view
         */
        // either displays the original layer in default mode or changes to modified layer
        oldLayer.visible = false;
        newLayer.visible = true;
    }

    async ftAccess(layer) {
        /**
         *  This method is called in the main fct. It takes a layer as input and saves each feature of that layer into the graphics var. Graphics is an array containing objects, each objects represents one feature from that layer.
         */
        const polygonLayerView = await this.view.whenLayerView(layer);

        try {
            const query = new this.params["Query"]();
            query.returnGeometry = true;
            query.outFields = ["*"];
            const featureSet = await polygonLayerView.queryFeatures(query);
            const graphics = featureSet.features;
            return graphics;
        } catch (error) {
            console.error("Query failed: ", error);
        }
    }


    async buildingFct(featureSet, selectedFeature, ctrl) {
        /**
 * This method is the "main" method for the Flurstuecke Berechnen widget. It is called in the mainFct method
 * and does all the processing of the data and creates the layer and the corresponding feature table.
 * It takes the featureSet from ftAcess method and the selected feature  as input.
 * It returns the newly calculated layer and its corresponding featureTable
 *
 * @param {Array} featureSet - The featureSet from the ftAcess method
 * @param {Object} selectedFeature - The selected feature
 * @param {Boolean} ctrl - If true, multiple features can be selected
 * @returns {Array} - [layer, featureTable]
 */
        try {

            // set up processes to build layer and table from that data 
            const colsAndTypes = await this.fetchColsAndTypes(); // get the fields and their types for the feature table
            const intersectingFts = await this.intersectCalc(selectedFeature, featureSet); // get the intersecting features
            // append the newly calculated fts into an array that contains all the intersecting fts
            this.currentCombinedFts.push(...intersectingFts)

            // check if user wants to select multiple features and if he already clicked on the first feature
            if (this.intersectingFtsFromFtBefore && ctrl === true) {

                // creates a layer and feature table that contains all selected features from all the features clicked so far
                const [layerOutput, shownTable] = await this.layerAndTableBuilder(this.currentCombinedFts, colsAndTypes);
                return [layerOutput, shownTable]

            } else {
                // if not, just create the layer and feature table from current intersecting fts and use that

                const [layerOutput, shownTable] = await this.layerAndTableBuilder(intersectingFts, colsAndTypes);
                return [layerOutput, shownTable]
            }


        } catch (error) {
            console.error('Fehler beim Erstellen der Gebäudefunktion:', error);
            return null;
        }
    }


    async layerAndTableBuilder(fts, colsAndTypes) {
        /**
         * This method is called in the building fct. It takes as input an array of features (fts) and an array of objects that contain
         * fieldnames as keys and modified fieldtypes (not esriFieldTypeXXX but instead only "string" or "integer") as values. It creates a
         * layer and corresponding feature table from that data.
         *
         * @param {Array} fts - An array of features
         * @param {Array} colsAndTypes - An array of objects containing fieldnames as keys and modified fieldtypes as values
         * @returns {Array} - [layer, featureTable]
         */

        // create a layer and array of fieldnames and fieldtypes from the given fts and colsAndTypes
        const newLayer = await this.createFilteredLayer(fts, colsAndTypes)
        // get the newly created layer and the array of fields and their types from the createFilteredLayer method
        const layerOutput = newLayer[0];
        const arrFieldsAndTypeOfLayer = newLayer[1];
        // creates a corresponding feature table
        const shownTable = await this.createOwnerTable(layerOutput, arrFieldsAndTypeOfLayer, this.tableFields);

        // saves the intersecting features from the ftAcess method to a class field
        this.intersectingFtsFromFtBefore = fts;

        return [layerOutput, shownTable]

    }


    createOwnerTable(layer, allFields, providedFields) {
        /**
 * This method is called in the building fct. It creates a feature table and a table div DOM Element.
 * It adds the table to the map view and modifies its size.
 * It activates an event listener that triggers when a feature is selected in the feature table.
 * If so, it will set the extent of the map view to that selected feature.
 * 
 * @param {Object} layer - The newly created layer with features
 * @param {Array} allFields - An array with objects that containt all field names as key and modified fieldtypes (not esriFieldTypeXXX but instead only "string" or "integer")
 * @param {Object} providedFields - An object with the fieldname as key and the label name as value. Only used if not empty.
 * @returns {Object} - The created feature table
 */

        // create the table element
        this.tableDiv = document.createElement("div");
        this.tableDiv.id = "table";
        document.getElementById("viewDiv").insertAdjacentElement('afterend', this.tableDiv);
        let colTemplates;
        // if providedFields has content
        if (Object.keys(providedFields).length === 0) {
            const transformedList = [];
            for (const obj of allFields) {
                const newObj = {};
                const key = obj["name"];
                newObj[key] = key;
                transformedList.push(newObj);
            }
            colTemplates = this.createColTemplates(transformedList);
            // if not just take all fields
        } else {
            colTemplates = this.createColTemplates(providedFields);
        }

        // append that feature table to tablediv element
        const featureTable = new this.params["FeatureTable"]({
            view: this.view,
            layer: layer,
            visibleElements: {
                menuItems: {
                    clearSelection: true,
                }
            },
            tableTemplate: {
                columnTemplates: colTemplates
            },
            container: this.tableDiv
        });
        //add it to the view and modify its size
        this.view.ui.add(featureTable, "bottom-right")
        this.tableDiv.style.width = "4000px"
        this.tableDiv.style.height = "250px"

        // when a feature is selected in the table it sets the extent to that feature in the map view
        featureTable.highlightIds.on("change", (event) => {
            if (event.added[0] !== undefined) {
                const query2 = new this.params["Query"]();
                query2.where = `${layer.objectIdField} = ${event.added}`;
                query2.returnGeometry = true;
                layer.queryFeatures(query2).then((response) => {
                    const features = response.features;
                    this.view.goTo(features[0].geometry);
                });
            }
        });

        return featureTable;
    }


    async fetchColsAndTypes() {
        /**
 * This method is called in the building fct. It fetches the data from the corresponding portalService
 * and saves and returns that result into colsAndTypes, which is an array containing objects.
 * Each object has the field name as key and the fieldtype as value.
 * The Field Types are in the format "esriFieldTypeXXX"
 *
 * @returns {Array} colsAndTypes - An array containing objects. Each object has the field name as
 * key and the fieldtype as value. Field Type is in the format "esriFieldTypeXXX"
 */
        const colsAndTypes = [];
        const info = new this.params["OAuthInfo"]({
            portalUrl: this.portalUrl,
            appId: this.appId,
            popup: false
        });
        this.params["esriId"].registerOAuthInfos([info]);

        try {
            const response = await this.params["esriId"].checkSignInStatus(`${this.portalUrl}/sharing`);
            const token = response.token;
            const request = `${this.url}?f=json&token=${token}`;

            const responseData = await fetch(request);

            if (!responseData.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await responseData.json();
            const fetched_layer_data = data.fields;

            fetched_layer_data.forEach((obj) => {
                const formattedOBJ = {};
                formattedOBJ[obj.name] = obj.type;
                colsAndTypes.push(formattedOBJ);
            });

            return colsAndTypes;
        } catch (error) {
            throw error;
        }
    }



    async intersectCalc(selectedFeature, polygonFeatures) {
        /** 
         * This method is called by the building fct and does the actual geometric calculation. 
         * It takes the selected feature and the featureSet, that was received in the ftaccess method and determines, and checks for every feature in that polygonFeatureInputArray, if there is an intersecting relationship with the selected feature.
         * If so, it saves that into the intersectingFeaturesArray - so that array contains of objects that contain information about the feature.
         * IntersectingFeaturesAttributes saves the attributes property of each of these objects
         */
        try {
            const intersectingFeatures = [];
            const intersectingFeaturesAttributes = [];
            const lineGeo = selectedFeature.geometry;

            // Array für Promises
            const promises = [];

            // Iteration über polygonFeatures mit Promises
            for (const element of polygonFeatures) {
                const promise = new Promise((resolve, reject) => {
                    if (this.params["geometryEngine"].intersects(element.geometry, lineGeo)) {
                        intersectingFeatures.push(element);
                        resolve();
                    } else {
                        resolve(); // Promise erfüllen, auch wenn das Element nicht intersektiert
                    }
                });
                promises.push(promise);
            }

            // Warten auf Abschluss aller Promises
            await Promise.all(promises);

            // Verarbeitung der gefundenen intersektierenden Features
            if (intersectingFeatures.length > 0) {
                for (const feature of intersectingFeatures) {
                    intersectingFeaturesAttributes.push(feature.attributes);
                }
                return intersectingFeatures;
            } else {
                throw new Error("Your selected feature has no intersections with another feature from the provided layer");
            }
        } catch (error) {
            console.error("Error in intersectCalc:", error);
            alert(error.message);
            return null;
        }
    }

    async createFilteredLayer(values, colsAndTypes) {
        /**
         * This Method is called in the Building Fct. It takes as input the calculated features which intersect with the selected feature(array with objects)(values) and also an array with objects which contain in each object the fieldname as key and the value is the fieldtype (colsandtypes)
         *1. Modifies colsandtypes: checks every key (field name) and modifies its old value (esriFieldTypeXXX to a version, that is accepted by the new FeatureLayer method from esri (only accepts integer,string etc.))
         2. that results in a new array with objects which have one key (the field name) and one value (the modified field type)
         3. this new array is passed into new FeatureLayer method
         4. That new feature layer is added to the map, it will be made visible in the changeshownlayer method
         5. returns that new layer and also the corresponding array with objects that have fieldname as key and modifiedfieldtype as value
          */
        const arrWithCols = [];
        colsAndTypes.forEach(obj => {
            for (const [name, type] of Object.entries(obj)) {
                let fieldType = "";
                switch (type) {
                    case "esriFieldTypeOID":
                    case "esriFieldTypeGlobalID":
                        fieldType = "oid";
                        break;
                    case "esriFieldTypeInteger":
                    case "esriFieldTypeSmallInteger":
                        fieldType = "integer";
                        break;
                    case "esriFieldTypeDouble":
                        fieldType = "double";
                        break;
                    case "esriFieldTypeString":
                        fieldType = "string";
                        break;
                    case "esriFieldTypeDate":
                        fieldType = "date";
                        break;
                    default:
                        fieldType = "string";
                }

                const newField = {
                    name: name,
                    type: fieldType
                };
                arrWithCols.push(newField);
            }
        });

        const popupPolygonNewLayer = {
            "title": "Polygon Information",
            "content": "TEST"
        };


        const tempLayer = new this.params["FeatureLayer"]({
            source: values,
            objectIdField: "objectid",
            fields: arrWithCols,
            popupTemplate: popupPolygonNewLayer
        });

        this.map.add(tempLayer);
        tempLayer.visible = false;
        return [tempLayer, arrWithCols];
    }

    createOwnerTable(layer, allFields, providedFields) {
        /**
         * This method is called in the building fct. It takes as input the newly calculated layer from the createfilteredlayer method, an array with objects that containt all field names as key and modified fieldtypes (not esriFieldTypeXXX but instead only "string" or "integer"). The provided fields parameter can be an empty list, in that case the method will create a feature table from all fields and label them by their field name. If there is a list of objects passed in with the fieldname as key and the label name as value, it will create a feature table only from the provided fields. 
         * Then it creates the feature table and a table div DOM Element
         * Adds it to the map view and modifies its size
         * Activates an event listener that triggers at soon as a feature is selected in the feature table. If so, it will set the extent of the map view to that selected feature. 
         */

        // create the table element
        const tableDiv = document.createElement("div");
        tableDiv.id = "table";
        document.getElementById("viewDiv").insertAdjacentElement('afterend', tableDiv);
        let colTemplates;
        // if providedFields has content
        if (Object.keys(providedFields).length === 0) {
            const transformedList = [];
            for (const obj of allFields) {
                const newObj = {};
                const key = obj["name"];
                newObj[key] = key;
                transformedList.push(newObj);
            }
            colTemplates = this.createColTemplates(transformedList);
            // if not just take all fields
        } else {
            colTemplates = this.createColTemplates(providedFields);
        }

        // append that feature table to tablediv element
        const featureTable = new this.params["FeatureTable"]({
            view: this.view,
            layer: layer,
            visibleElements: {
                menuItems: {
                    clearSelection: true,
                }
            },
            tableTemplate: {
                columnTemplates: colTemplates
            },
            container: tableDiv
        });
        //add it to the view and modify its size
        this.view.ui.add(featureTable, "bottom-right")
        tableDiv.style.width = "4000px"
        tableDiv.style.height = "250px"

        // when a feature is selected in the table it sets the extent to that feature in the map view
        featureTable.highlightIds.on("change", (event) => {
            if (event.added[0] !== undefined) {
                const query2 = new this.params["Query"]();
                query2.where = `${layer.objectIdField} = ${event.added}`;
                query2.returnGeometry = true;
                layer.queryFeatures(query2).then((response) => {
                    const features = response.features;
                    this.view.goTo(features[0].geometry);
                });
            }
        });

        return featureTable;
    }

    createColTemplates(objectArray) {
        /**
         * This method is called in the createOwnerTableMethod. As Input it takes in an array of objects, from which it will create the column templates which will then be passed into the createfeaturetable method. 
         */

        const columnTemplates = [];
        for (const fieldName in objectArray) {
            const obj = objectArray[fieldName];
            const key = Object.keys(obj)[0];
            const value = obj[key]


            const columnTemplate = {
                type: "field",
                fieldName: key,
                label: value,
                direction: "asc"
            };
            columnTemplates.push(columnTemplate);
        }
        return columnTemplates;
    }



    changeCursor() {
        //called in the startediting method
        // change cursor appearance
        this.view.cursor = "crosshair"

    }

    undoCursor() {
        //called in the stopediting method
        // change cursor back to normal
        this.view.cursor = "default";

    }

    createInfoWindow() {
        /**
         * called in starteventlistener and startediting methods
         * 1.creates a dom element and modifies its styling and attributes
         * 2. adds it to the DOM
         * 3. implements a function that listens for the position of the mouse cursor
         * 4 . Passes those cords into antoher fct, that modifies those cors so that they can be used from the DOM Element - result is that the p DOM ElEment follows the mouse cursor
         *
         */
        // a little window pops up when button pressed
        // creates the cursor info HTML
        this.cursorInfoDOMElement = document.createElement("p");
        this.cursorInfoDOMElement.id = "cursorInfo";
        this.cursorInfoDOMElement.textContent = "Wählen Sie ein Feature aus ...";
        this.cursorInfoDOMElement.style.position = "absolute"; // Set position to absolute for manual positioning

        // Set white background color for text
        this.cursorInfoDOMElement.style.backgroundColor = "white";

        // Set border radius to round corners
        this.cursorInfoDOMElement.style.borderRadius = "5px";

        document.body.appendChild(this.cursorInfoDOMElement);

        function updateCursorInfoPosition(x, y, domElement) {
            domElement.style.left = (x + 10) + "px"; // Adjust the left position by 10px
            domElement.style.top = (y + 10) + "px"; // Adjust the top position by 10px
        }

        // Event listener for pointer move event
        this.cursorListener = this.view.on("pointer-move", function (event) {
            let x = event.x;
            let y = event.y;
            updateCursorInfoPosition(x, y, this.cursorInfoDOMElement); // Update position of cursor info element
        }.bind(this));
    }
    hideInfoWindow() {
        /** 
         * called in starteventwatcher and stopediting methods
         * This method checks for the parent node of the info window DOM Element and removes that info Window DOM Element. Then it also removes the event listener that was checking for the cors of the cursor.
         */
        // Überprüfen, ob cursorInfoDOMElement existiert
        if (this.cursorInfoDOMElement) {
            // Den Elternknoten von cursorInfoDOMElement finden
            const parentNode = this.cursorInfoDOMElement.parentNode;

            // Überprüfen, ob parentNode existiert und cursorInfoDOMElement ein Kind von parentNode ist
            if (parentNode && parentNode.contains(this.cursorInfoDOMElement)) {
                // Entfernen Sie cursorInfoDOMElement vom parentNode
                parentNode.removeChild(this.cursorInfoDOMElement);
            }
            this.cursorListener.remove()
        }
    }

    deleteFeatureTable() {
        /**
         * called in stopediting, mainfct and starteventlistener methods
         * if the table DOM  Element was created at the time this method is called, it removes that table.
         */
        const tableDiv = document.getElementById("table");
        if (tableDiv) {
            tableDiv.parentNode.removeChild(tableDiv);
        }
    }

    deleteNewLayers() {
        /** 
         * called in starteventwatcher method and stop editing method
         * if there has already been the original layer of the map (layerlist[0]) appended to the layerlist, it makes that layer visible. All other layers in that array will be made invisible and removed from the map.
         */
        if (this.layerList[0]) {
            this.layerList[0].visible = true;
        }
        for (let i = 1; i < this.layerList.length; i++) {
            this.layerList[i].visible = false;
            this.map.remove(this.layerList[i]);
        }
    }

}




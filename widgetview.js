
function createIntersectWidget(mainElementID, view, polygonLayerService, layerUrl, portalUrl, appId, tableFields, params, map) {
    /**
     * Creates a button in the view and returns it. The button is used to trigger the widget.
     * 
     * @param {string} mainElementID - The id of the HTML element where the button should be added
     * @param {esri.views.MapView} view - The view where the button should be added
     **/
    const widgetStyles = ["esri-icon-measure-area", "esri-icon-close"];
    const findOwnerBtn = document.createElement("button");
    const buttonClassStartName = "esri-icon-review esri-widget--button esri-widget esri-interactive";
    const buttonClassEndName = "esri-icon-close esri-widget--button esri-widget esri-interactive";
    const mainDiv = mainElementID;
    findOwnerBtn.id = "findOwnerBtn";
    findOwnerBtn.className = buttonClassStartName;
    mainDiv.appendChild(findOwnerBtn);
    const widget = new CalcOwnerWidget(view, polygonLayerService, layerUrl, portalUrl, appId, tableFields, params, map);

    let isPressed = false; // Variable to track button state

    findOwnerBtn.addEventListener('click', () => {
        if (!isPressed) {
            findOwnerBtn.style.backgroundColor = "rgba(200, 200, 200)"
            isPressed = true;
        } else {
            findOwnerBtn.style.backgroundColor = ""
            isPressed = false;
        }
        widget.init();
    });

    view.ui.add(findOwnerBtn, "top-leading");

    return findOwnerBtn;
}

//linelayer
const layerLine = "url\\to\\layerline";
//polygonlayer
const layerPolygon = "url\\to\\layerpolygon";

// reference the actual layers inside the service
const url = "url\\to\\layerpolygon/1";

// here you provide the fieldname that you want to see in the table and the value is the name of the column that is displays, you can leave it empty - by default it will show all columns and name the columns like the field name
const tableFields = [
  {
    field1: "aliasname1",
  },
  {
    field2: "aliasname2",
  },
  {
    field3: "aliasname3",
  },
];

//Create the PopUps for the layers
const popupLineLayer = {
  title: "This is the title of line layer",
  content: "This is the content of line layer",
};
const popupPolygonLayer = {
  title: "This is the title of the polygon layer",
  content: "This is content of polygon layer",
};

// //////////////////////////////////////

const portalUrl = "https://arcgis.com";
const appId = "yourAppID";

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// load the map
require([
  "esri/Map",
  "esri/views/MapView",
  "esri/layers/FeatureLayer",
  "esri/geometry/geometryEngine",
  "esri/widgets/Popup",
  "esri/widgets/FeatureTable",
  "esri/core/reactiveUtils",
  "esri/rest/support/Query",
  "esri/portal/Portal",
  "esri/identity/OAuthInfo",
  "esri/identity/IdentityManager",
  "esri/widgets/Bookmarks",
  "esri/widgets/Expand",
  "esri/widgets/Legend",
  "esri/widgets/Compass",
  "esri/widgets/Locate",
  "esri/widgets/AreaMeasurement2D",
  "esri/widgets/DistanceMeasurement2D",
  "esri/widgets/ScaleBar",
  "esri/widgets/CoordinateConversion",
  "esri/widgets/Print",
  "esri/widgets/LayerList",

  "esri/rest/places",
  "esri/rest/support/FetchPlaceParameters",
  "esri/rest/support/PlacesQueryParameters",
  "esri/geometry/Circle",
  "esri/geometry/Point",
  "esri/Graphic",
  "esri/layers/GraphicsLayer",
  "esri/symbols/WebStyleSymbol",
], function (
  Map,
  MapView,
  FeatureLayer,
  geometryEngine,
  Popup,
  FeatureTable,
  reactiveUtils,
  Query,
  Portal,
  OAuthInfo,
  esriId,
  Bookmarks,
  Expand,
  Legend,
  Compass,
  Locate,
  ScaleBar,
  CoordinateConversion,
  Print,
  LayerList,
  places,
  FetchPlaceParameters,
  PlacesQueryParameters,
  Circle,
  Point,
  Graphic,
  GraphicsLayer,
  WebStyleSymbol
) {
  // needed for the intersect custom widget
  const params = {
    FeatureLayer: FeatureLayer,
    geometryEngine: geometryEngine,
    FeatureTable: FeatureTable,
    reactiveUtils: reactiveUtils,
    Query: Query,
    Portal: Portal,
    OAuthInfo: OAuthInfo,
    esriId: esriId,
  };

  //Define map and map view
  const map = new Map({
    basemap: "osm",
  });

  const view = new MapView({
    container: "viewDiv",
    map: map,
    zoom: 3,
    center: [-98, 38.5],
    popup: {
      dockEnabled: true,
      dockOptions: {
        buttonEnabled: false,
        breakpoint: false,
      },
    },
  });

  const lineLayer = new FeatureLayer({
    url: layerLine,
    id: "line",
    outFields: ["*"],
    popupTemplate: popupLineLayer,
  });

  const polygonLayer = new FeatureLayer({
    url: layerPolygon,
    id: "polygon",
    opacity: 0.5,
    outFields: ["*"],
    popupTemplate: popupPolygonLayer,
  });

  const mainDiv = document.getElementById("viewDiv");

  // Standard Widget configurations
  const widgetConfigurations = [
    {
      widget: Bookmarks,
      options: {
        view: view,
        dragEnabled: true,
        visibleElements: {
          addBookmarkButton: true,
          editBookmarkButton: true,
          time: false,
        },
      },
      position: "top-leading",
      expand: true,
    },
    {
      widget: Legend,
      options: { view: view, style: "card" },
      position: "top-leading",
      expand: true,
    },
    {
      widget: Compass,
      options: { view: view },
      position: "top-leading",
      expand: false,
    },
    {
      widget: Locate,
      options: { view: view },
      position: "top-leading",
      expand: false,
    },
    ,
    {
      widget: LayerList,
      options: { view: view },
      position: "top-leading",
      expand: true,
    },
    {
      widget: ScaleBar,
      options: { view: view, unit: "metric" },
      position: "bottom-left",
      expand: false,
    },
    {
      widget: CoordinateConversion,
      options: { view: view },
      position: "bottom-right",
      expand: false,
    },
  ];

  // Add layers to the map
  map.add(lineLayer);
  map.add(polygonLayer);

  // Add default widgets
  widgetConfigurations.forEach((widgetConfig) => {
    const { widget, options, position, expand } = widgetConfig;
    const newWidget = new widget(options);

    if (expand) {
      const expandWidget = new Expand({
        view: view,
        content: newWidget,
        expanded: false,
      });
      view.ui.add(expandWidget, position);
    } else {
      view.ui.add(newWidget, position);
    }
  });

  // add larger widgets that are stored in the widgets folder
  createIntersectWidget(
    mainDiv,
    view,
    polygonLayer,
    url,
    portalUrl,
    appId,
    tableFields,
    params,
    map
  );

  // set map extent
  Promise.all([lineLayer.load(), polygonLayer.load()])
    .then(() => {
      const combinedExtent = geometryEngine.union([
        lineLayer.fullExtent,
        polygonLayer.fullExtent,
      ]);
      view.goTo(combinedExtent);
    })
    .catch((error) => {
      console.error("Error loading layers:", error);
    });

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
});

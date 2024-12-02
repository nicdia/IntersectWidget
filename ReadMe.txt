Polygon Intersection Widget

Ein Esri ArcGIS Widget für die Visualisierung und Interaktion mit Polygonlayern basierend auf ausgewählten Features. Es wird mit der JavaScript API for ArcGIS gearbeitet.


Funktionalität

Das Widget bietet folgende Features und Abläufe:
1. Editiermodus starten

    Der Editiermodus wird aktiviert, indem auf das Widget geklickt wird.
    Die Polygonlayer wird ausgeblendet.

2. Feature-Auswahl

    Ein Klick auf ein Feature einer anderen (Linien-)Layer führt zu einer Intersect-Berechnung.
    Es werden alle Features der Polygonlayer angezeigt, die das ausgewählte Feature berühren oder enthalten.

3. Einzel- oder Mehrfachauswahl

    Einzelauswahl: Durch Klicken auf ein weiteres Feature wird dieses ausgewählt.
    Mehrfachauswahl: Halte die STRG-Taste gedrückt, um mehrere Features auszuwählen. Die Intersections aller ausgewählten Features werden kombiniert.

4. Interaktion mit der Tabelle

    Die FeatureTable wird entsprechend der Auswahl aktualisiert.
    Ein Klick auf ein Tabellen-Feature zoomt die Karte auf dieses Feature.

5. Auswahl beenden

    Ein Klick auf ein leeres Kartenelement (kein Feature) beendet die Auswahl.
    Die Tabelle und alle Feature-Visualisierungen werden ausgeblendet.

6. Editiermodus beenden

    Der Editiermodus wird beendet, indem erneut auf das Widget geklickt wird.
    Alle Layer und Visualisierungen kehren in ihren Ausgangszustand zurück.


Voraussetzungen
Das Widget benötigt die folgenden Parameter, um ordnungsgemäß zu funktionieren:
    1. mainElementID
         - Das DOM-Element, an dem der Button für das Widget angefügt wird. Dieses Element muss das Map-View-Element enthalten.

    2. view
        - Die Variable, in der die Esri mapView-Instanz gespeichert ist.

    3. polygonLayerService
        - Das PolygonLayer-Objekt, das den gewünschten Service referenziert. Achtung: Es muss das Layer-Objekt angegeben werden, nicht die URL zum Service.

    4. layerUrl
        - Die URL der spezifischen Layer, die die Polygone enthält.
        Hinweis: ArcGIS Online kann mehrere Layer in einem Service bereitstellen. Daher muss die gewünschte Layer explizit angegeben werden.
            const layerUrl = "https://services.arcgis.com/{organization-id}/arcgis/rest/services/PolygonService/FeatureServer/1";

    5. portalUrl
        - Die URL zu ArcGIS Online ("https://www.arcgis.com")
            
    6. appId
        - Die App-ID der Authentifizierungs-App in ArcGIS Online.

    7. tableFields (optional)
        - Definiert, welche Felder aus der Polygonlayer in der Tabelle angezeigt werden.
        Dieser Parameter muss eine Liste von Objekten sein.

        Key: Der Feldname in der Layer.
        Value: Die gewünschte Bezeichnung der Tabellenspalte.

        Alternativ kann eine leere Liste ([]) übergeben werden, um alle Felder mit ihrem Standardnamen anzuzeigen.

        Beispiele:

            Anzeige spezifischer Felder:

        const tableFields = [
        { "NOF": "Name" },
        { "objectid": "ObjektID" }
        ];

        Anzeige aller Felder:

            const tableFields = [];

    8. params
        - Ein Objekt, das die benötigten Esri-Module referenziert.
    Erforderliches Format:

        const params = {
        "FeatureLayer": FeatureLayer,
        "geometryEngine": geometryEngine,
        "FeatureTable": FeatureTable,
        "reactiveUtils": reactiveUtils,
        "Query": Query,
        "Portal": Portal,
        "OAuthInfo": OAuthInfo,
        "esriId": esriId
        };

            Hinweis: Stelle sicher, dass alle Module im require-Statement geladen sind:

        require([
        "esri/layers/FeatureLayer",
        "esri/geometry/geometryEngine",
        "esri/widgets/FeatureTable",
        "esri/core/reactiveUtils",
        "esri/rest/support/Query",
        "esri/portal/Portal",
        "esri/identity/OAuthInfo", 
        "esri/identity/IdentityManager"
        ], function (FeatureLayer, geometryEngine, FeatureTable, reactiveUtils, Query, Portal, OAuthInfo, esriId) {
        // Code hier
        });

    9. map
        -Das Map-Objekt, z. B.:
            const map = new Map({ ... });



Installation und Nutzung

    Lade alle erforderlichen Esri-Module in deinem Projekt:

require([
  // Module-Liste (siehe oben)
], function (...Modules) {
  // Widget-Integration hier
});

Erstelle eine Instanz des Widgets, indem du alle Parameter bereitstellst:

const widget = new MyWidget({
  mainElementID: "mapDiv",
  view: mapView,
  polygonLayerService: myPolygonLayer,
  layerUrl: "https://example.com/PolygonService/FeatureServer/1",
  portalUrl: "https://arcgisportal.de",
  appId: "12345",
  tableFields: [{ "NOF": "Name" }, { "objectid": "ObjektID" }],
  params: params,
  map: map
});

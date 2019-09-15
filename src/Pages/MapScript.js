
import { Map } from '@esri/react-arcgis';
import {MapView} from '@esri/react-arcgis';
import {Search} from '@esri/react-arcgis';
import {Graphic} from '@esri/react-arcgis';
import {RouteTask} from '@esri/react-arcgis';
import {RouteParameters} from '@esri/react-arcgis';
import {FeatureSet} from '@esri/react-arcgis';



//function(Map, MapView, Search, Graphic, RouteTask, RouteParameters, FeatureSet) {
const noop = () => {};

export const map = new Map({
    basemap: "streets-night-vector"
});

// Restrict area map to Toronto area
export const view = new MapView({
    container: "viewDiv",
    map: map,
    center: [-79.4490546145549, 43.6674604374397],
    zoom: 10
});

// To allow access to the route service and prevent the user from signing in
export const routeTask = new RouteTask({
    url: "https://route.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World"
});

view.on("click", function (event) {
    if (view.graphics.length === 0) {
        addGraphic("start", event.mapPoint);
    } else if (view.graphics.length === 1) {
        addGraphic("finish", event.mapPoint);
        // Call the route service
        getRoute();
    } else {
        view.graphics.removeAll();
        addGraphic("start", event.mapPoint);
    }
});

// Add trailheads
function addGraphic(type, point) {
    var graphic = new Graphic({
        symbol: {
            type: "simple-marker",
            color: (type === "start") ? "white" : "black",
            size: "8px"
        },
        geometry: point
    });
    view.graphics.add(graphic);
}

function getRoute() {
    // Set up the route parameters
    var routeParams = new RouteParameters({
        stops: new FeatureSet({
            features: view.graphics.toArray()
        }),
        returnDirections: true
    });
    // Get the route
    routeTask.solve(routeParams).then(function (data) {
        data.routeResults.forEach(function (result) {
            result.route.symbol = {
                type: "simple-line",
                color: [255, 153, 0],
                width: 3
            };
            view.graphics.add(result.route);
        });

    });
}

// Add search widget
export const search = new Search({
    view: view
});

view.on("click", function (evt) {
    search.clear();
    view.popup.clear();
    if (search.activeSource) {
        var geocoder = search.activeSource.locator; // World geocode service
        var params = {
            location: evt.mapPoint
        };
        geocoder.locationToAddress(params)
            .then(function (response) { // Show the address found
                var address = response.address;
                showPopup(address, evt.mapPoint);
            }, function (err) { // Show no address found
                showPopup("No address found.", evt.mapPoint);
            });
    }
});

// Reverse geocode lookup
function showPopup(address, pt) {
    view.popup.open({
        title: + Math.round(pt.longitude * 100000) / 100000 + "," + Math.round(pt.latitude * 100000) / 100000,
        content: address,
        location: pt
    });
}

export const initialize = (container) => {
    view.container = container;
    view
        .when()
        .then(_ => {
            console.log("Map is ready");
        })
        .catch(noop);
    return () => {
        view.container = null;
    };
};

  //});
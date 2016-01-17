var Sampler2D = require("awayjs-core/lib/image/Sampler2D");
var URLLoader = require("awayjs-core/lib/net/URLLoader");
var URLLoaderDataFormat = require("awayjs-core/lib/net/URLLoaderDataFormat");
var URLRequest = require("awayjs-core/lib/net/URLRequest");
var URLLoaderEvent = require("awayjs-core/lib/events/URLLoaderEvent");
var ParserUtils = require("awayjs-core/lib/parsers/ParserUtils");
var RequestAnimationFrame = require("awayjs-core/lib/utils/RequestAnimationFrame");
var Debug = require("awayjs-core/lib/utils/Debug");
var View = require("awayjs-display/lib/containers/View");
var PointLight = require("awayjs-display/lib/entities/PointLight");
var StaticLightPicker = require("awayjs-display/lib/materials/lightpickers/StaticLightPicker");
var PrimitiveTorusPrefab = require("awayjs-display/lib/prefabs/PrimitiveTorusPrefab");
var DefaultRenderer = require("awayjs-renderergl/lib/DefaultRenderer");
var MethodMaterial = require("awayjs-methodmaterials/lib/MethodMaterial");
var TorusObject3DDemo = (function () {
    function TorusObject3DDemo() {
        var _this = this;
        this.t = 0;
        this.tPos = 0;
        this.radius = 1000;
        this.follow = true;
        Debug.THROW_ERRORS = false;
        Debug.LOG_PI_ERRORS = false;
        this.meshes = new Array();
        this.light = new PointLight();
        this.view = new View(new DefaultRenderer());
        this.pointLight = new PointLight();
        this.lightPicker = new StaticLightPicker([this.pointLight]);
        this.view.scene.addChild(this.pointLight);
        var perspectiveLens = this.view.camera.projection;
        perspectiveLens.fieldOfView = 75;
        this.view.camera.z = 0;
        this.view.backgroundColor = 0x000000;
        this.view.backgroundAlpha = 1;
        this.torus = new PrimitiveTorusPrefab(150, 50, 32, 32, false);
        var l = 10;
        for (var c = 0; c < l; c++) {
            var t = Math.PI * 2 * c / l;
            var mesh = this.torus.getNewObject();
            mesh.x = Math.cos(t) * this.radius;
            mesh.y = 0;
            mesh.z = Math.sin(t) * this.radius;
            this.view.scene.addChild(mesh);
            this.meshes.push(mesh);
        }
        this.view.scene.addChild(this.light);
        this.raf = new RequestAnimationFrame(this.tick, this);
        this.raf.start();
        this.onResize();
        document.onmousedown = function (event) { return _this.followObject(event); };
        window.onresize = function (event) { return _this.onResize(event); };
        this.loadResources();
    }
    TorusObject3DDemo.prototype.loadResources = function () {
        var _this = this;
        var urlRequest = new URLRequest("assets/custom_uv_horizontal.png");
        var urlLoader = new URLLoader();
        urlLoader.dataFormat = URLLoaderDataFormat.BLOB;
        urlLoader.addEventListener(URLLoaderEvent.LOAD_COMPLETE, function (event) { return _this.imageCompleteHandler(event); });
        urlLoader.load(urlRequest);
    };
    TorusObject3DDemo.prototype.imageCompleteHandler = function (event) {
        var _this = this;
        var urlLoader = event.target;
        this._image = ParserUtils.blobToImage(urlLoader.data);
        this._image.onload = function (event) { return _this.onImageLoadComplete(event); };
    };
    TorusObject3DDemo.prototype.onImageLoadComplete = function (event) {
        var matTx = new MethodMaterial(ParserUtils.imageToBitmapImage2D(this._image));
        matTx.style.sampler = new Sampler2D(true, true, true);
        matTx.lightPicker = this.lightPicker;
        for (var c = 0; c < this.meshes.length; c++)
            this.meshes[c].material = matTx;
    };
    TorusObject3DDemo.prototype.tick = function (dt) {
        this.tPos += .02;
        for (var c = 0; c < this.meshes.length; c++) {
            var objPos = Math.PI * 2 * c / this.meshes.length;
            this.t += .005;
            var s = 1.2 + Math.sin(this.t + objPos);
            this.meshes[c].rotationY += 2 * (c / this.meshes.length);
            this.meshes[c].rotationX += 2 * (c / this.meshes.length);
            this.meshes[c].rotationZ += 2 * (c / this.meshes.length);
            this.meshes[c].scaleX = this.meshes[c].scaleY = this.meshes[c].scaleZ = s;
            this.meshes[c].x = Math.cos(objPos + this.tPos) * this.radius;
            this.meshes[c].y = Math.sin(this.t) * 500;
            this.meshes[c].z = Math.sin(objPos + this.tPos) * this.radius;
        }
        //this.view.camera.y = Math.sin( this.tPos ) * 1500;
        if (this.follow)
            this.view.camera.lookAt(this.meshes[0].transform.position);
        this.view.camera.y = Math.sin(this.tPos) * 1500;
        this.view.render();
    };
    TorusObject3DDemo.prototype.onResize = function (event) {
        if (event === void 0) { event = null; }
        this.view.y = 0;
        this.view.x = 0;
        this.view.width = window.innerWidth;
        this.view.height = window.innerHeight;
    };
    TorusObject3DDemo.prototype.followObject = function (e) {
        this.follow = !this.follow;
    };
    return TorusObject3DDemo;
})();

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm9iamVjdDNkL1RvcnVzT2JqZWN0M0REZW1vLnRzIl0sIm5hbWVzIjpbIlRvcnVzT2JqZWN0M0REZW1vIiwiVG9ydXNPYmplY3QzRERlbW8uY29uc3RydWN0b3IiLCJUb3J1c09iamVjdDNERGVtby5sb2FkUmVzb3VyY2VzIiwiVG9ydXNPYmplY3QzRERlbW8uaW1hZ2VDb21wbGV0ZUhhbmRsZXIiLCJUb3J1c09iamVjdDNERGVtby5vbkltYWdlTG9hZENvbXBsZXRlIiwiVG9ydXNPYmplY3QzRERlbW8udGljayIsIlRvcnVzT2JqZWN0M0REZW1vLm9uUmVzaXplIiwiVG9ydXNPYmplY3QzRERlbW8uZm9sbG93T2JqZWN0Il0sIm1hcHBpbmdzIjoiQUFDQSxJQUFPLFNBQVMsV0FBZSxpQ0FBaUMsQ0FBQyxDQUFDO0FBQ2xFLElBQU8sU0FBUyxXQUFlLCtCQUErQixDQUFDLENBQUM7QUFDaEUsSUFBTyxtQkFBbUIsV0FBYSx5Q0FBeUMsQ0FBQyxDQUFDO0FBQ2xGLElBQU8sVUFBVSxXQUFlLGdDQUFnQyxDQUFDLENBQUM7QUFDbEUsSUFBTyxjQUFjLFdBQWMsdUNBQXVDLENBQUMsQ0FBQztBQUM1RSxJQUFPLFdBQVcsV0FBZSxxQ0FBcUMsQ0FBQyxDQUFDO0FBRXhFLElBQU8scUJBQXFCLFdBQVksNkNBQTZDLENBQUMsQ0FBQztBQUN2RixJQUFPLEtBQUssV0FBZ0IsNkJBQTZCLENBQUMsQ0FBQztBQUUzRCxJQUFPLElBQUksV0FBaUIsb0NBQW9DLENBQUMsQ0FBQztBQUVsRSxJQUFPLFVBQVUsV0FBZSx3Q0FBd0MsQ0FBQyxDQUFDO0FBQzFFLElBQU8saUJBQWlCLFdBQWEsNkRBQTZELENBQUMsQ0FBQztBQUNwRyxJQUFPLG9CQUFvQixXQUFhLGlEQUFpRCxDQUFDLENBQUM7QUFHM0YsSUFBTyxlQUFlLFdBQWMsdUNBQXVDLENBQUMsQ0FBQztBQUU3RSxJQUFPLGNBQWMsV0FBYywyQ0FBMkMsQ0FBQyxDQUFDO0FBRWhGLElBQU0saUJBQWlCO0lBbUJ0QkEsU0FuQktBLGlCQUFpQkE7UUFBdkJDLGlCQTRJQ0E7UUFuSVFBLE1BQUNBLEdBQVVBLENBQUNBLENBQUNBO1FBQ2JBLFNBQUlBLEdBQVVBLENBQUNBLENBQUNBO1FBQ2hCQSxXQUFNQSxHQUFVQSxJQUFJQSxDQUFDQTtRQUNyQkEsV0FBTUEsR0FBV0EsSUFBSUEsQ0FBQ0E7UUFTN0JBLEtBQUtBLENBQUNBLFlBQVlBLEdBQUdBLEtBQUtBLENBQUNBO1FBQzNCQSxLQUFLQSxDQUFDQSxhQUFhQSxHQUFHQSxLQUFLQSxDQUFDQTtRQUU1QkEsSUFBSUEsQ0FBQ0EsTUFBTUEsR0FBR0EsSUFBSUEsS0FBS0EsRUFBUUEsQ0FBQ0E7UUFDaENBLElBQUlBLENBQUNBLEtBQUtBLEdBQUdBLElBQUlBLFVBQVVBLEVBQUVBLENBQUNBO1FBQzlCQSxJQUFJQSxDQUFDQSxJQUFJQSxHQUFHQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxlQUFlQSxFQUFFQSxDQUFDQSxDQUFDQTtRQUM1Q0EsSUFBSUEsQ0FBQ0EsVUFBVUEsR0FBR0EsSUFBSUEsVUFBVUEsRUFBRUEsQ0FBQ0E7UUFDbkNBLElBQUlBLENBQUNBLFdBQVdBLEdBQUdBLElBQUlBLGlCQUFpQkEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsVUFBVUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7UUFFNURBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEtBQUtBLENBQUNBLFFBQVFBLENBQUNBLElBQUlBLENBQUNBLFVBQVVBLENBQUNBLENBQUNBO1FBRTFDQSxJQUFJQSxlQUFlQSxHQUFpREEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsVUFBVUEsQ0FBQ0E7UUFDaEdBLGVBQWVBLENBQUNBLFdBQVdBLEdBQUdBLEVBQUVBLENBQUNBO1FBRWpDQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQTtRQUN2QkEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsZUFBZUEsR0FBR0EsUUFBUUEsQ0FBQ0E7UUFDckNBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLGVBQWVBLEdBQUdBLENBQUNBLENBQUNBO1FBQzlCQSxJQUFJQSxDQUFDQSxLQUFLQSxHQUFHQSxJQUFJQSxvQkFBb0JBLENBQUNBLEdBQUdBLEVBQUVBLEVBQUVBLEVBQUVBLEVBQUVBLEVBQUVBLEVBQUVBLEVBQUVBLEtBQUtBLENBQUNBLENBQUNBO1FBRTlEQSxJQUFJQSxDQUFDQSxHQUFVQSxFQUFFQSxDQUFDQTtRQUdsQkEsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBWUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBR0EsQ0FBQ0EsRUFBRUEsRUFBRUEsQ0FBQ0E7WUFFdENBLElBQUlBLENBQUNBLEdBQVVBLElBQUlBLENBQUNBLEVBQUVBLEdBQUdBLENBQUNBLEdBQUdBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO1lBRW5DQSxJQUFJQSxJQUFJQSxHQUFlQSxJQUFJQSxDQUFDQSxLQUFLQSxDQUFDQSxZQUFZQSxFQUFFQSxDQUFDQTtZQUNqREEsSUFBSUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsSUFBSUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsR0FBQ0EsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0E7WUFDakNBLElBQUlBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO1lBQ1hBLElBQUlBLENBQUNBLENBQUNBLEdBQUdBLElBQUlBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLENBQUNBLEdBQUNBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBO1lBRWpDQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxLQUFLQSxDQUFDQSxRQUFRQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtZQUMvQkEsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFFeEJBLENBQUNBO1FBRURBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEtBQUtBLENBQUNBLFFBQVFB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akJBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQVVBLENBQUNBLEVBQUdBLENBQUNBLEdBQUdBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLE1BQU1BLEVBQUdBLENBQUNBLEVBQUdBLEVBQUVBLENBQUNBO1lBQ3ZEQSxJQUFJQSxNQUFNQSxHQUFRQSxJQUFJQSxDQUFDQSxFQUFFQSxHQUFDQSxDQUFDQSxHQUFDQSxDQUFDQSxHQUFDQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxNQUFNQSxDQUFDQTtZQUVqREEsSUFBSUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsSUFBSUEsQ0FBQ0E7WUFDZkEsSUFBSUEsQ0FBQ0EsR0FBVUEsR0FBR0EsR0FBR0EsSUFBSUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsTUFBTUEsQ0FBQ0EsQ0FBQ0E7WUFFL0NBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLENBQUNBLENBQUNBLENBQUNBLFNBQVNBLElBQUlBLENBQUNBLEdBQUNBLENBQUNBLENBQUNBLEdBQUNBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLE1BQU1BLENBQUNBLENBQUNBO1lBQ3JEQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxTQUFTQSxJQUFJQSxDQUFDQSxHQUFDQSxDQUFDQSxDQUFDQSxHQUFDQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxNQUFNQSxDQUFDQSxDQUFDQTtZQUNyREEsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsU0FBU0EsSUFBSUEsQ0FBQ0EsR0FBQ0EsQ0FBQ0EsQ0FBQ0EsR0FBQ0EsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsQ0FBQ0E7WUFDckRBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLENBQUNBLENBQUNBLENBQUNBLE1BQU1BLEdBQUdBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLENBQUNBLENBQUNBLENBQUNBLE1BQU1BLEdBQUdBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLENBQUNBLENBQUNBLENBQUNBLE1BQU1BLEdBQUdBLENBQUNBLENBQUNBO1lBQzFFQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxHQUFHQSxJQUFJQSxDQUFDQSxHQUFHQSxDQUFDQSxNQUFNQSxHQUFHQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxHQUFDQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQTtZQUM1REEsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsSUFBSUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsR0FBQ0EsR0FBR0EsQ0FBQ0E7WUFDeENBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLEdBQUdBLElBQUlBLENBQUNBLEdBQUdBLENBQUNBLE1BQU1BLEdBQUdBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEdBQUNBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBO1FBQzdEQSxDQUFDQTtRQUVEQSxBQUVBQSxvREFGb0RBO1FBRXBEQSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQTtZQUNmQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxTQUFTQSxDQUFDQSxRQUFRQSxDQUFDQSxDQUFDQTtRQUU1REEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsSUFBSUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsR0FBR0EsSUFBSUEsQ0FBQ0E7UUFFaERBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLE1BQU1BLEVBQUVBLENBQUNBO0lBQ3BCQSxDQUFDQTtJQUVNTCxvQ0FBUUEsR0FBZkEsVUFBZ0JBLEtBQW9CQTtRQUFwQk0scUJBQW9CQSxHQUFwQkEsWUFBb0JBO1FBRW5DQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQTtRQUNoQkEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0E7UUFFaEJBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEtBQUtBLEdBQUdBLE1BQU1BLENBQUNBLFVBQVVBLENBQUNBO1FBQ3BDQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxNQUFNQSxHQUFHQSxNQUFNQSxDQUFDQSxXQUFXQSxDQUFDQTtJQUN2Q0EsQ0FBQ0E7SUFFTU4sd0NBQVlBLEdBQW5CQSxVQUFvQkEsQ0FBQ0E7UUFFcEJPLElBQUlBLENBQUNBLE1BQU1BLEdBQUdBLENBQUNBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBO0lBQzVCQSxDQUFDQTtJQUNGUCx3QkFBQ0E7QUFBREEsQ0E1SUEsQUE0SUNBLElBQUEiLCJmaWxlIjoib2JqZWN0M2QvVG9ydXNPYmplY3QzRERlbW8uanMiLCJzb3VyY2VSb290IjoiLi90ZXN0cyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBCaXRtYXBJbWFnZTJEXHRcdFx0XHQ9IHJlcXVpcmUoXCJhd2F5anMtY29yZS9saWIvaW1hZ2UvQml0bWFwSW1hZ2UyRFwiKTtcbmltcG9ydCBTYW1wbGVyMkRcdFx0XHRcdFx0PSByZXF1aXJlKFwiYXdheWpzLWNvcmUvbGliL2ltYWdlL1NhbXBsZXIyRFwiKTtcbmltcG9ydCBVUkxMb2FkZXJcdFx0XHRcdFx0PSByZXF1aXJlKFwiYXdheWpzLWNvcmUvbGliL25ldC9VUkxMb2FkZXJcIik7XG5pbXBvcnQgVVJMTG9hZGVyRGF0YUZvcm1hdFx0XHRcdD0gcmVxdWlyZShcImF3YXlqcy1jb3JlL2xpYi9uZXQvVVJMTG9hZGVyRGF0YUZvcm1hdFwiKTtcbmltcG9ydCBVUkxSZXF1ZXN0XHRcdFx0XHRcdD0gcmVxdWlyZShcImF3YXlqcy1jb3JlL2xpYi9uZXQvVVJMUmVxdWVzdFwiKTtcbmltcG9ydCBVUkxMb2FkZXJFdmVudFx0XHRcdFx0PSByZXF1aXJlKFwiYXdheWpzLWNvcmUvbGliL2V2ZW50cy9VUkxMb2FkZXJFdmVudFwiKTtcbmltcG9ydCBQYXJzZXJVdGlsc1x0XHRcdFx0XHQ9IHJlcXVpcmUoXCJhd2F5anMtY29yZS9saWIvcGFyc2Vycy9QYXJzZXJVdGlsc1wiKTtcbmltcG9ydCBQZXJzcGVjdGl2ZVByb2plY3Rpb25cdFx0PSByZXF1aXJlKFwiYXdheWpzLWNvcmUvbGliL3Byb2plY3Rpb25zL1BlcnNwZWN0aXZlUHJvamVjdGlvblwiKTtcbmltcG9ydCBSZXF1ZXN0QW5pbWF0aW9uRnJhbWVcdFx0PSByZXF1aXJlKFwiYXdheWpzLWNvcmUvbGliL3V0aWxzL1JlcXVlc3RBbmltYXRpb25GcmFtZVwiKTtcbmltcG9ydCBEZWJ1Z1x0XHRcdFx0XHRcdD0gcmVxdWlyZShcImF3YXlqcy1jb3JlL2xpYi91dGlscy9EZWJ1Z1wiKTtcblxuaW1wb3J0IFZpZXdcdFx0XHRcdFx0XHRcdD0gcmVxdWlyZShcImF3YXlqcy1kaXNwbGF5L2xpYi9jb250YWluZXJzL1ZpZXdcIik7XG5pbXBvcnQgTWVzaFx0XHRcdFx0XHRcdFx0PSByZXF1aXJlKFwiYXdheWpzLWRpc3BsYXkvbGliL2VudGl0aWVzL01lc2hcIik7XG5pbXBvcnQgUG9pbnRMaWdodFx0XHRcdFx0XHQ9IHJlcXVpcmUoXCJhd2F5anMtZGlzcGxheS9saWIvZW50aXRpZXMvUG9pbnRMaWdodFwiKTtcbmltcG9ydCBTdGF0aWNMaWdodFBpY2tlclx0XHRcdD0gcmVxdWlyZShcImF3YXlqcy1kaXNwbGF5L2xpYi9tYXRlcmlhbHMvbGlnaHRwaWNrZXJzL1N0YXRpY0xpZ2h0UGlja2VyXCIpO1xuaW1wb3J0IFByaW1pdGl2ZVRvcnVzUHJlZmFiXHRcdFx0PSByZXF1aXJlKFwiYXdheWpzLWRpc3BsYXkvbGliL3ByZWZhYnMvUHJpbWl0aXZlVG9ydXNQcmVmYWJcIik7XG5pbXBvcnQgU2luZ2xlMkRUZXh0dXJlXHRcdFx0XHQ9IHJlcXVpcmUoXCJhd2F5anMtZGlzcGxheS9saWIvdGV4dHVyZXMvU2luZ2xlMkRUZXh0dXJlXCIpO1xuXG5pbXBvcnQgRGVmYXVsdFJlbmRlcmVyXHRcdFx0XHQ9IHJlcXVpcmUoXCJhd2F5anMtcmVuZGVyZXJnbC9saWIvRGVmYXVsdFJlbmRlcmVyXCIpO1xuXG5pbXBvcnQgTWV0aG9kTWF0ZXJpYWxcdFx0XHRcdD0gcmVxdWlyZShcImF3YXlqcy1tZXRob2RtYXRlcmlhbHMvbGliL01ldGhvZE1hdGVyaWFsXCIpO1xuXG5jbGFzcyBUb3J1c09iamVjdDNERGVtb1xue1xuXHRwcml2YXRlIHZpZXc6Vmlldztcblx0cHJpdmF0ZSB0b3J1czpQcmltaXRpdmVUb3J1c1ByZWZhYjtcblxuXHRwcml2YXRlIGxpZ2h0OlBvaW50TGlnaHQ7XG5cdHByaXZhdGUgcmFmOlJlcXVlc3RBbmltYXRpb25GcmFtZTtcblx0cHJpdmF0ZSBtZXNoZXM6QXJyYXk8TWVzaD47XG5cblx0cHJpdmF0ZSB0Om51bWJlciA9IDA7XG5cdHByaXZhdGUgdFBvczpudW1iZXIgPSAwO1xuXHRwcml2YXRlIHJhZGl1czpudW1iZXIgPSAxMDAwO1xuXHRwcml2YXRlIGZvbGxvdzpib29sZWFuID0gdHJ1ZTtcblxuXHRwcml2YXRlIHBvaW50TGlnaHQ6UG9pbnRMaWdodDtcblx0cHJpdmF0ZSBsaWdodFBpY2tlcjpTdGF0aWNMaWdodFBpY2tlcjtcblxuXHRwcml2YXRlIF9pbWFnZTpIVE1MSW1hZ2VFbGVtZW50O1xuXG5cdGNvbnN0cnVjdG9yKClcblx0e1xuXHRcdERlYnVnLlRIUk9XX0VSUk9SUyA9IGZhbHNlO1xuXHRcdERlYnVnLkxPR19QSV9FUlJPUlMgPSBmYWxzZTtcblxuXHRcdHRoaXMubWVzaGVzID0gbmV3IEFycmF5PE1lc2g+KCk7XG5cdFx0dGhpcy5saWdodCA9IG5ldyBQb2ludExpZ2h0KCk7XG5cdFx0dGhpcy52aWV3ID0gbmV3IFZpZXcobmV3IERlZmF1bHRSZW5kZXJlcigpKTtcblx0XHR0aGlzLnBvaW50TGlnaHQgPSBuZXcgUG9pbnRMaWdodCgpO1xuXHRcdHRoaXMubGlnaHRQaWNrZXIgPSBuZXcgU3RhdGljTGlnaHRQaWNrZXIoW3RoaXMucG9pbnRMaWdodF0pO1xuXG5cdFx0dGhpcy52aWV3LnNjZW5lLmFkZENoaWxkKHRoaXMucG9pbnRMaWdodCk7XG5cblx0XHR2YXIgcGVyc3BlY3RpdmVMZW5zOlBlcnNwZWN0aXZlUHJvamVjdGlvbiA9IDxQZXJzcGVjdGl2ZVByb2plY3Rpb24+IHRoaXMudmlldy5jYW1lcmEucHJvamVjdGlvbjtcblx0XHRwZXJzcGVjdGl2ZUxlbnMuZmllbGRPZlZpZXcgPSA3NTtcblxuXHRcdHRoaXMudmlldy5jYW1lcmEueiA9IDA7XG5cdFx0dGhpcy52aWV3LmJhY2tncm91bmRDb2xvciA9IDB4MDAwMDAwO1xuXHRcdHRoaXMudmlldy5iYWNrZ3JvdW5kQWxwaGEgPSAxO1xuXHRcdHRoaXMudG9ydXMgPSBuZXcgUHJpbWl0aXZlVG9ydXNQcmVmYWIoMTUwLCA1MCwgMzIsIDMyLCBmYWxzZSk7XG5cblx0XHR2YXIgbDpudW1iZXIgPSAxMDtcblx0XHQvL3ZhciByYWRpdXM6bnVtYmVyID0gMTAwMDtcblxuXHRcdGZvciAodmFyIGMgOiBudW1iZXIgPSAwOyBjIDwgbCA7IGMrKykge1xuXG5cdFx0XHR2YXIgdCA6IG51bWJlcj1NYXRoLlBJICogMiAqIGMgLyBsO1xuXG5cdFx0XHR2YXIgbWVzaDpNZXNoID0gPE1lc2g+IHRoaXMudG9ydXMuZ2V0TmV3T2JqZWN0KCk7XG5cdFx0XHRtZXNoLnggPSBNYXRoLmNvcyh0KSp0aGlzLnJhZGl1cztcblx0XHRcdG1lc2gueSA9IDA7XG5cdFx0XHRtZXNoLnogPSBNYXRoLnNpbih0KSp0aGlzLnJhZGl1cztcblxuXHRcdFx0dGhpcy52aWV3LnNjZW5lLmFkZENoaWxkKG1lc2gpO1xuXHRcdFx0dGhpcy5tZXNoZXMucHVzaChtZXNoKTtcblxuXHRcdH1cblxuXHRcdHRoaXMudmlldy5zY2VuZS5hZGRDaGlsZCh0aGlzLmxpZ2h0KTtcblxuXHRcdHRoaXMucmFmID0gbmV3IFJlcXVlc3RBbmltYXRpb25GcmFtZSh0aGlzLnRpY2ssIHRoaXMpO1xuXHRcdHRoaXMucmFmLnN0YXJ0KCk7XG5cdFx0dGhpcy5vblJlc2l6ZSgpO1xuXG5cdFx0ZG9jdW1lbnQub25tb3VzZWRvd24gPSAoZXZlbnQ6TW91c2VFdmVudCkgPT4gdGhpcy5mb2xsb3dPYmplY3QoZXZlbnQpO1xuXG5cdFx0d2luZG93Lm9ucmVzaXplID0gKGV2ZW50OlVJRXZlbnQpID0+IHRoaXMub25SZXNpemUoZXZlbnQpO1xuXG5cdFx0dGhpcy5sb2FkUmVzb3VyY2VzKCk7XG5cdH1cblxuXHRwcml2YXRlIGxvYWRSZXNvdXJjZXMoKVxuXHR7XG5cdFx0dmFyIHVybFJlcXVlc3Q6VVJMUmVxdWVzdCA9IG5ldyBVUkxSZXF1ZXN0KFwiYXNzZXRzL2N1c3RvbV91dl9ob3Jpem9udGFsLnBuZ1wiKTtcblx0XHR2YXIgdXJsTG9hZGVyOlVSTExvYWRlciA9IG5ldyBVUkxMb2FkZXIoKTtcblx0XHR1cmxMb2FkZXIuZGF0YUZvcm1hdCA9IFVSTExvYWRlckRhdGFGb3JtYXQuQkxPQjtcblx0XHR1cmxMb2FkZXIuYWRkRXZlbnRMaXN0ZW5lcihVUkxMb2FkZXJFdmVudC5MT0FEX0NPTVBMRVRFLCAoZXZlbnQ6VVJMTG9hZGVyRXZlbnQpID0+IHRoaXMuaW1hZ2VDb21wbGV0ZUhhbmRsZXIoZXZlbnQpKTtcblx0XHR1cmxMb2FkZXIubG9hZCh1cmxSZXF1ZXN0KTtcblx0fVxuXG5cdHByaXZhdGUgaW1hZ2VDb21wbGV0ZUhhbmRsZXIoZXZlbnQ6VVJMTG9hZGVyRXZlbnQpXG5cdHtcblx0XHR2YXIgdXJsTG9hZGVyOlVSTExvYWRlciA9IGV2ZW50LnRhcmdldDtcblxuXHRcdHRoaXMuX2ltYWdlID0gUGFyc2VyVXRpbHMuYmxvYlRvSW1hZ2UodXJsTG9hZGVyLmRhdGEpO1xuXHRcdHRoaXMuX2ltYWdlLm9ubG9hZCA9IChldmVudDpFdmVudCkgPT4gdGhpcy5vbkltYWdlTG9hZENvbXBsZXRlKGV2ZW50KTtcblxuXHR9XG5cblx0cHJpdmF0ZSBvbkltYWdlTG9hZENvbXBsZXRlKGV2ZW50OkV2ZW50KVxuXHR7XG5cdFx0dmFyIG1hdFR4Ok1ldGhvZE1hdGVyaWFsID0gbmV3IE1ldGhvZE1hdGVyaWFsKFBhcnNlclV0aWxzLmltYWdlVG9CaXRtYXBJbWFnZTJEKHRoaXMuX2ltYWdlKSk7XG5cdFx0bWF0VHguc3R5bGUuc2FtcGxlciA9IG5ldyBTYW1wbGVyMkQodHJ1ZSwgdHJ1ZSwgdHJ1ZSk7XG5cdFx0bWF0VHgubGlnaHRQaWNrZXIgPSAgdGhpcy5saWdodFBpY2tlcjtcblxuXHRcdGZvciAodmFyIGM6bnVtYmVyID0gMDsgYyA8IHRoaXMubWVzaGVzLmxlbmd0aDsgYyArKylcblx0XHRcdHRoaXMubWVzaGVzW2NdLm1hdGVyaWFsID0gbWF0VHg7XG5cdH1cblxuXHRwcml2YXRlIHRpY2soZHQ6bnVtYmVyKVxuXHR7XG5cdFx0dGhpcy50UG9zICs9IC4wMjtcblxuXHRcdGZvciAodmFyIGM6bnVtYmVyID0gMCA7IGMgPCB0aGlzLm1lc2hlcy5sZW5ndGggOyBjICsrKSB7XG5cdFx0XHR2YXIgb2JqUG9zOm51bWJlcj1NYXRoLlBJKjIqYy90aGlzLm1lc2hlcy5sZW5ndGg7XG5cblx0XHRcdHRoaXMudCArPSAuMDA1O1xuXHRcdFx0dmFyIHM6bnVtYmVyID0gMS4yICsgTWF0aC5zaW4odGhpcy50ICsgb2JqUG9zKTtcblxuXHRcdFx0dGhpcy5tZXNoZXNbY10ucm90YXRpb25ZICs9IDIqKGMvdGhpcy5tZXNoZXMubGVuZ3RoKTtcblx0XHRcdHRoaXMubWVzaGVzW2NdLnJvdGF0aW9uWCArPSAyKihjL3RoaXMubWVzaGVzLmxlbmd0aCk7XG5cdFx0XHR0aGlzLm1lc2hlc1tjXS5yb3RhdGlvblogKz0gMiooYy90aGlzLm1lc2hlcy5sZW5ndGgpO1xuXHRcdFx0dGhpcy5tZXNoZXNbY10uc2NhbGVYID0gdGhpcy5tZXNoZXNbY10uc2NhbGVZID0gdGhpcy5tZXNoZXNbY10uc2NhbGVaID0gcztcblx0XHRcdHRoaXMubWVzaGVzW2NdLnggPSBNYXRoLmNvcyhvYmpQb3MgKyB0aGlzLnRQb3MpKnRoaXMucmFkaXVzO1xuXHRcdFx0dGhpcy5tZXNoZXNbY10ueSA9IE1hdGguc2luKHRoaXMudCkqNTAwO1xuXHRcdFx0dGhpcy5tZXNoZXNbY10ueiA9IE1hdGguc2luKG9ialBvcyArIHRoaXMudFBvcykqdGhpcy5yYWRpdXM7XG5cdFx0fVxuXG5cdFx0Ly90aGlzLnZpZXcuY2FtZXJhLnkgPSBNYXRoLnNpbiggdGhpcy50UG9zICkgKiAxNTAwO1xuXG5cdFx0aWYgKHRoaXMuZm9sbG93KVxuXHRcdFx0dGhpcy52aWV3LmNhbWVyYS5sb29rQXQodGhpcy5tZXNoZXNbMF0udHJhbnNmb3JtLnBvc2l0aW9uKTtcblxuXHRcdHRoaXMudmlldy5jYW1lcmEueSA9IE1hdGguc2luKHRoaXMudFBvcykgKiAxNTAwO1xuXG5cdFx0dGhpcy52aWV3LnJlbmRlcigpO1xuXHR9XG5cblx0cHVibGljIG9uUmVzaXplKGV2ZW50OlVJRXZlbnQgPSBudWxsKVxuXHR7XG5cdFx0dGhpcy52aWV3LnkgPSAwO1xuXHRcdHRoaXMudmlldy54ID0gMDtcblxuXHRcdHRoaXMudmlldy53aWR0aCA9IHdpbmRvdy5pbm5lcldpZHRoO1xuXHRcdHRoaXMudmlldy5oZWlnaHQgPSB3aW5kb3cuaW5uZXJIZWlnaHQ7XG5cdH1cblxuXHRwdWJsaWMgZm9sbG93T2JqZWN0KGUpXG5cdHtcblx0XHR0aGlzLmZvbGxvdyA9ICF0aGlzLmZvbGxvdztcblx0fVxufSJdfQ==
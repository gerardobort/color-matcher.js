;(function (ns) {

    var _getUserMedia = (
        navigator.getUserMedia
        || navigator.webkitGetUserMedia
        || navigator.mozGetUserMedia
        || navigator.msGetUserMedia
    ).bind(navigator);


    var ColorMatcher = ns.ColorMatcher = function (videoWidth, videoHeight) {
        this.VIDEO_WIDTH = videoWidth || 720;
        this.VIDEO_HEIGHT = videoHeight || 480;

        this.canvas = document.createElement('canvas');
        this.canvas.id = 'color-matching';
        this.canvas.style.webkitTransform = 'scaleX(-1)'; // TODO redo: hack for mirroring
        this.canvasContext = this.canvas.getContext('2d');

        this.video = document.createElement('video');
        this.video.autoplay = 'true';
        this.video.style.display = 'none';

        this.canvas.width = this.VIDEO_WIDTH;
        this.canvas.height = this.VIDEO_HEIGHT;
        this.video.width = this.VIDEO_WIDTH;
        this.video.height = this.VIDEO_HEIGHT;

        document.body.appendChild(this.canvas);
        document.body.appendChild(this.video);
        
    };

    ColorMatcher.prototype.listen = function () {
        var instance = this;
        _getUserMedia({ video: true },
            function (stream) {
                instance.video.src = webkitURL.createObjectURL(stream);
                requestAnimationFrame(instance.getVideoFrame.bind(instance));
                console.log('Listening...');
            },
            function () {
                throw 'ColorMatching error during webcam initialization.';
            }
        );
    };

    ColorMatcher.prototype.getVideoFrame = function () {
        this.canvasContext.drawImage(this.video, 0, 0, this.VIDEO_WIDTH, this.VIDEO_HEIGHT);
        this.imageData = this.canvasContext.getImageData(0, 0, this.VIDEO_WIDTH, this.VIDEO_HEIGHT);
        this.update(this.imageData);
        requestAnimationFrame(this.getVideoFrame.bind(this));
    };

    ColorMatcher.prototype.update = function (imageData) {
        var pixels = imageData.data;
            pixelsLenght = pixels.lenght;
        // DO THINGS
        console.log('update');
        this.canvasContext.putImageData(imageData, 0, 0);
    };

    ColorMatcher.prototype.getPredominantColors = function (expectedNumberOfColors, callback) {
        
    };


}(window))

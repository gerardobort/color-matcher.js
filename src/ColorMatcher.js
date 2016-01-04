;(function (ns) {

    var _getUserMedia = (
        navigator.getUserMedia
        || navigator.webkitGetUserMedia
        || navigator.mozGetUserMedia
        || navigator.msGetUserMedia
    ).bind(navigator);

    var _rgb2hsv = function (colorVec) {
        var rr, gg, bb,
            r = colorVec[0] / 255,
            g = colorVec[1] / 255,
            b = colorVec[2] / 255,
            h, s,
            v = Math.max(r, g, b),
            diff = v - Math.min(r, g, b),
            diffc = function (c) {
                return (v - c) / 6 / diff + 1 / 2;
            };

        if (diff === 0) {
            h = s = 0;
        } else {
            s = diff / v;
            rr = diffc(r);
            gg = diffc(g);
            bb = diffc(b);

            if (r === v) {
                h = bb - gg;
            } else if (g === v) {
                h = (1 / 3) + rr - bb;
            } else if (b === v) {
                h = (2 / 3) + gg - rr;
            }

            if (h < 0) {
                h += 1;
            } else if (h > 1) {
                h -= 1;
            }
        }
        return [ Math.round(h * 360), Math.round(s * 100), Math.round(v * 100) ]
    };


    var ColorMatcher = ns.ColorMatcher = function () {
        this.VIDEO_WIDTH = 1280;
        this.VIDEO_HEIGHT = 960;
        this.SAMPLING_GRID_THRESHOLD = 20;

        this.canvas = document.createElement('canvas');
        this.canvas.id = 'color-matching';
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

    ColorMatcher.prototype.colorHex2Vec = function (hex) {
        var offset = (3 === hex.length || 6 === hex.length ? 0 : 1),
            elemLength = (hex.length < 5 ? 1 : 2);
        return [
            parseInt(hex.substr(0 + offset, elemLength), 16),
            parseInt(hex.substr(1 + offset, elemLength), 16),
            parseInt(hex.substr(2 + offset, elemLength), 16),
        ];
    };

    ColorMatcher.prototype.listen = function (colorPaletteHex, onGetMatchesCallback) {
        var instance = this;

        this.colorPaletteHex = (colorPaletteHex || ['#F00', '#0F0', '#00F']);
        this.colorPaletteVec = this.colorPaletteHex.map(this.colorHex2Vec);
        this.colorPaletteVecHSV = this.colorPaletteVec.map(_rgb2hsv);
        this.onGetMatchesCallback = onGetMatchesCallback;

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

    ColorMatcher.prototype.findBestMatchIndexInPalette = function (colorVec) {
        var minDistance = Infinity,
            minIndex = -1,
            colorVecHSV = _rgb2hsv(colorVec),
            tmpDistance, i, l = this.colorPaletteHex.length;
        for (i = 0; i < l; i++) {
            // HSV color distance
            // if ((tmpDistance = this.getColorsDistanceVec(colorVecHSV, this.colorPaletteVecHSV[i])) < minDistance) {

            // RGB color distance
            if ((tmpDistance = this.getColorsDistanceVec(colorVec, this.colorPaletteVec[i])) < minDistance) {
                minIndex = i;
                minDistance = tmpDistance;
            }
        }
        return minIndex;
    };

    ColorMatcher.prototype.getColorsDistanceVec = function (v1, v2) {
        return Math.sqrt(Math.pow(v1[0] - v2[0], 2) + Math.pow(v1[1] - v2[1], 2) + Math.pow(v1[2] - v2[2], 2));
    };

    ColorMatcher.prototype.update = function (imageData) {
        var pixels = imageData.data;
            pixelsLength = pixels.length,
            totalCycles = pixelsLength / 4 / this.SAMPLING_GRID_THRESHOLD / this.SAMPLING_GRID_THRESHOLD;

        var matchingIndexes = { }; // map - index, value
        matchingIndexes = this.colorPaletteHex.map(function () { return 0; });
            
        this.canvasContext.putImageData(imageData, 0, 0);

        // calculate matching percentages for each index in the color palette
        var i, tmpColor, tmpIndex, x, y, w = this.VIDEO_WIDTH, h = this.VIDEO_HEIGHT;
        for (i = 0; i < pixelsLength; i += 4) {
            x = (i/4) % w;
            y = parseInt((i/4) / w);
            
            // if the current pixel belongs to the sampling grid...
            if (!(x % this.SAMPLING_GRID_THRESHOLD) && !(y % this.SAMPLING_GRID_THRESHOLD)) {
                // get the best match in the color palette...
                tmpColor = [pixels[i], pixels[i+1], pixels[i+2]];
                tmpIndex = this.findBestMatchIndexInPalette(tmpColor);
                // increment the usae ratio for this color
                matchingIndexes[tmpIndex] += 1/totalCycles;

                // draw the debug dots
                this.canvasContext.beginPath();
                this.canvasContext.arc(x, y, 3, 0, 2 * Math.PI);
                this.canvasContext.fillStyle = this.colorPaletteHex[tmpIndex];
                this.canvasContext.fill();
            }
        }

        this.onGetMatchesCallback(matchingIndexes);
    };


}(window))

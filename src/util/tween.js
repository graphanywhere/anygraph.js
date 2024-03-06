import Animation from "./animal.js";

/**
 * @class
 * Credits: TweenEasing Equations by Robert Penner, <http://www.robertpenner.com/easing/>
 */
const TweenEasing = {};

/**
 * Linear缓动
 */
TweenEasing.Linear = {

    /**
     * Function: easeIn
     * 
     * Parameters:
     * t - {Float} time
     * b - {Float} beginning position
     * c - {Float} total change
     * d - {Float} duration of the transition
     *
     * Returns:
     * {Float}
     */
    easeIn: function (t, b, c, d) {
        return c * t / d + b;
    },

    /**
     * Function: easeOut
     * 
     * Parameters:
     * t - {Float} time
     * b - {Float} beginning position
     * c - {Float} total change
     * d - {Float} duration of the transition
     *
     * Returns:
     * {Float}
     */
    easeOut: function (t, b, c, d) {
        return c * t / d + b;
    },

    /**
     * Function: easeInOut
     * 
     * Parameters:
     * t - {Float} time
     * b - {Float} beginning position
     * c - {Float} total change
     * d - {Float} duration of the transition
     *
     * Returns:
     * {Float}
     */
    easeInOut: function (t, b, c, d) {
        return c * t / d + b;
    }
}

/**
 * Expo 缓动
 */
TweenEasing.Expo = {

    /**
     * Function: easeIn
     * 
     * Parameters:
     * t - {Float} time
     * b - {Float} beginning position
     * c - {Float} total change
     * d - {Float} duration of the transition
     *
     * Returns:
     * {Float}
     */
    easeIn: function (t, b, c, d) {
        return (t == 0) ? b : c * Math.pow(2, 10 * (t / d - 1)) + b;
    },

    /**
     * Function: easeOut
     * 
     * Parameters:
     * t - {Float} time
     * b - {Float} beginning position
     * c - {Float} total change
     * d - {Float} duration of the transition
     *
     * Returns:
     * {Float}
     */
    easeOut: function (t, b, c, d) {
        return (t == d) ? b + c : c * (-Math.pow(2, -10 * t / d) + 1) + b;
    },

    /**
     * Function: easeInOut
     * 
     * Parameters:
     * t - {Float} time
     * b - {Float} beginning position
     * c - {Float} total change
     * d - {Float} duration of the transition
     *
     * Returns:
     * {Float}
     */
    easeInOut: function (t, b, c, d) {
        if (t == 0) return b;
        if (t == d) return b + c;
        if ((t /= d / 2) < 1) return c / 2 * Math.pow(2, 10 * (t - 1)) + b;
        return c / 2 * (-Math.pow(2, -10 * --t) + 2) + b;
    }
};

/**
 * Quad 缓动
 */
TweenEasing.Quad = {

    /**
     * Function: easeIn
     * 
     * Parameters:
     * t - {Float} time
     * b - {Float} beginning position
     * c - {Float} total change
     * d - {Float} duration of the transition
     *
     * Returns:
     * {Float}
     */
    easeIn: function (t, b, c, d) {
        return c * (t /= d) * t + b;
    },

    /**
     * Function: easeOut
     * 
     * Parameters:
     * t - {Float} time
     * b - {Float} beginning position
     * c - {Float} total change
     * d - {Float} duration of the transition
     *
     * Returns:
     * {Float}
     */
    easeOut: function (t, b, c, d) {
        return -c * (t /= d) * (t - 2) + b;
    },

    /**
     * Function: easeInOut
     * 
     * Parameters:
     * t - {Float} time
     * b - {Float} beginning position
     * c - {Float} total change
     * d - {Float} duration of the transition
     *
     * Returns:
     * {Float}
     */
    easeInOut: function (t, b, c, d) {
        if ((t /= d / 2) < 1) return c / 2 * t * t + b;
        return -c / 2 * ((--t) * (t - 2) - 1) + b;
    }
};

/**
 * Tween class
 */
class Tween {

    constructor(easing) {
        /**
         * APIProperty: easing
         * {<TweenEasing>(Function)} TweenEasing equation used for the animation Defaultly set to TweenEasing.Expo.easeOut
         */
        this.easing = this.easing = (easing) ? easing : TweenEasing.Expo.easeOut;

        /**
         * APIProperty = begin
         * {Object} Values to start the animation with
         */
        this.begin = null;

        /**
         * APIProperty = finish
         * {Object} Values to finish the animation with
         */
        this.finish = null;

        /**
         * APIProperty = duration
         * {int} duration of the tween (number of steps)
         */
        this.duration = null;

        /**
         * APIProperty = callbacks
         * {Object} An object with start, eachStep and done properties whose values
         *     are functions to be call during the animation. They are passed the
         *     current computed value as argument.
         */
        this.callbacks = null;

        /**
         * Property = time
         * {int} Step counter
         */
        this.time = null;

        /**
         * APIProperty = minFrameRate
         * {Number} The minimum framerate for animations in frames per second. After
         * each step, the time spent in the animation is compared to the calculated
         * time at this frame rate. If the animation runs longer than the calculated
         * time, the next step is skipped. Default is 30.
         */
        this.minFrameRate = null;

        /**
         * Property = startTime
         * {Number} The timestamp of the first execution step. Used for skipping
         * frames
         */
        this.startTime = null;

        /**
         * Property = animationId
         * {int} Loop id returned by Animation.start
         */
        this.animationId = null;

        /**
         * Property = playing
         * {Boolean} Tells if the easing is currently playing
         */
        this.playing = false;
    }

    /**
     * APIMethod: start
     * Plays the Tween, and calls the callback method on each step
     * 
     * Parameters:
     * begin - {Object} values to start the animation with
     * finish - {Object} values to finish the animation with
     * duration - {int} duration of the tween (number of steps)
     * options - {Object} hash of options (callbacks (start, eachStep, done), minFrameRate)
     */
    start(begin, finish, duration, options) {
        this.playing = true;
        this.begin = begin;
        this.finish = finish;
        this.duration = duration;
        this.callbacks = options.callbacks;
        this.minFrameRate = options.minFrameRate || 30;
        this.time = 0;
        this.startTime = new Date().getTime();
        Animation.stop(this.animationId);
        this.animationId = null;

        if (this.callbacks && this.callbacks.start) {
            this.callbacks.start(this, this.begin);
        }
        let that = this;
        this.animationId = Animation.start(function () {
            that.play()
        });
    }

    /**
     * APIMethod: stop
     * Stops the Tween, and calls the done callback
     *     Doesn't do anything if animation is already finished
     */
    stop() {
        if (!this.playing) {
            return;
        }

        if (this.callbacks && this.callbacks.done) {
            this.callbacks.done(this.finish);
        }
        Animation.stop(this.animationId);
        this.animationId = null;
        this.playing = false;
    }

    /**
     * Method: play
     * Calls the appropriate easing method
     */
    play() {
        var value = {};
        for (var i in this.begin) {
            var b = this.begin[i];
            var f = this.finish[i];
            if (b == null || f == null || isNaN(b) || isNaN(f)) {
                throw new TypeError('invalid value for Tween');
            }

            var c = f - b;
            value[i] = this.easing(this.time, b, c, this.duration);
        }
        this.time++;

        if (this.callbacks && this.callbacks.eachStep) {
            // skip frames if frame rate drops below threshold
            if ((new Date().getTime() - this.startTime) / this.time <= 1000 / this.minFrameRate) {
                this.callbacks.eachStep(value);
            }
        }

        if (this.time > this.duration) {
            this.stop();
        }
    }
}

export default Tween;
export { TweenEasing };

// let panMethod = TweenEasing.Expo.easeOut;

// let panTween = new Tween(panMethod);

// panTween.start({ x: 0, y: 0 }, vector, 500, {
//     callbacks: function (px) {
//         console.info(px);
//     },
//     done: function (px) {
//         console.info(px);
//     }
// });

import { Injectable, NgZone, Optional, NgModule, defineInjectable, inject } from '@angular/core';
import { from, fromEvent, interval, merge, of, Subject, timer } from 'rxjs';
import { bufferTime, distinctUntilChanged, filter, finalize, map, scan, switchMap, take, takeUntil, tap } from 'rxjs/operators';

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
var UserIdleConfig = /** @class */ (function () {
    function UserIdleConfig() {
    }
    return UserIdleConfig;
}());

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * User's idle service.
 */
var UserIdleService = /** @class */ (function () {
    function UserIdleService(config, _ngZone) {
        this._ngZone = _ngZone;
        this.timerStart$ = new Subject();
        this.idleDetected$ = new Subject();
        this.timeout$ = new Subject();
        /**
         * Idle value in milliseconds.
         * Default equals to 10 minutes.
         */
        this.idleMillisec = 600 * 1000;
        /**
         * Idle buffer wait time milliseconds to collect user action
         * Default equals to 1 Sec.
         */
        this.idleSensitivityMillisec = 1000;
        /**
         * Timeout value in seconds.
         * Default equals to 5 minutes.
         */
        this.timeout = 300;
        /**
         * Ping value in milliseconds.
         * Default equals to 2 minutes.
         */
        this.pingMillisec = 120 * 1000;
        if (config) {
            this.setConfig(config);
        }
    }
    /**
     * Start watching for user idle and setup timer and ping.
     */
    /**
     * Start watching for user idle and setup timer and ping.
     * @return {?}
     */
    UserIdleService.prototype.startWatching = /**
     * Start watching for user idle and setup timer and ping.
     * @return {?}
     */
    function () {
        var _this = this;
        if (!this.activityEvents$) {
            this.activityEvents$ = merge(fromEvent(window, 'mousemove'), fromEvent(window, 'resize'), fromEvent(document, 'keydown'));
        }
        this.idle$ = from(this.activityEvents$);
        if (this.idleSubscription) {
            this.idleSubscription.unsubscribe();
        }
        // If any of user events is not active for idle-seconds when start timer.
        this.idleSubscription = this.idle$
            .pipe(bufferTime(this.idleSensitivityMillisec), // Starting point of detecting of user's inactivity
        filter(function (arr) { return !arr.length && !_this.isIdleDetected && !_this.isInactivityTimer; }), tap(function () {
            _this.isIdleDetected = true;
            _this.idleDetected$.next(true);
        }), switchMap(function () {
            return _this._ngZone.runOutsideAngular(function () {
                return interval(1000).pipe(takeUntil(merge(_this.activityEvents$, timer(_this.idleMillisec).pipe(tap(function () {
                    _this.isInactivityTimer = true;
                    _this.timerStart$.next(true);
                })))), finalize(function () {
                    _this.isIdleDetected = false;
                    _this.idleDetected$.next(false);
                }));
            });
        }))
            .subscribe();
        this.setupTimer(this.timeout);
        this.setupPing(this.pingMillisec);
    };
    /**
     * @return {?}
     */
    UserIdleService.prototype.stopWatching = /**
     * @return {?}
     */
    function () {
        this.stopTimer();
        if (this.idleSubscription) {
            this.idleSubscription.unsubscribe();
        }
    };
    /**
     * @return {?}
     */
    UserIdleService.prototype.stopTimer = /**
     * @return {?}
     */
    function () {
        this.isInactivityTimer = false;
        this.timerStart$.next(false);
    };
    /**
     * @return {?}
     */
    UserIdleService.prototype.resetTimer = /**
     * @return {?}
     */
    function () {
        this.stopTimer();
        this.isTimeout = false;
    };
    /**
     * Return observable for timer's countdown number that emits after idle.
     */
    /**
     * Return observable for timer's countdown number that emits after idle.
     * @return {?}
     */
    UserIdleService.prototype.onTimerStart = /**
     * Return observable for timer's countdown number that emits after idle.
     * @return {?}
     */
    function () {
        var _this = this;
        return this.timerStart$.pipe(distinctUntilChanged(), switchMap(function (start) { return (start ? _this.timer$ : of(null)); }));
    };
    /**
     * Return observable for idle status changed
     */
    /**
     * Return observable for idle status changed
     * @return {?}
     */
    UserIdleService.prototype.onIdleStatusChanged = /**
     * Return observable for idle status changed
     * @return {?}
     */
    function () {
        return this.idleDetected$.asObservable();
    };
    /**
     * Return observable for timeout is fired.
     */
    /**
     * Return observable for timeout is fired.
     * @return {?}
     */
    UserIdleService.prototype.onTimeout = /**
     * Return observable for timeout is fired.
     * @return {?}
     */
    function () {
        var _this = this;
        return this.timeout$.pipe(filter(function (timeout) { return !!timeout; }), tap(function () { return (_this.isTimeout = true); }), map(function () { return true; }));
    };
    /**
     * @return {?}
     */
    UserIdleService.prototype.getConfigValue = /**
     * @return {?}
     */
    function () {
        return {
            idle: this.idleMillisec,
            idleSensitivity: this.idleSensitivityMillisec,
            timeout: this.timeout,
            ping: this.pingMillisec
        };
    };
    /**
     * Set config values.
     * @param config
     */
    /**
     * Set config values.
     * @param {?} config
     * @return {?}
     */
    UserIdleService.prototype.setConfigValues = /**
     * Set config values.
     * @param {?} config
     * @return {?}
     */
    function (config) {
        if (this.idleSubscription && !this.idleSubscription.closed) {
            console.error('Call stopWatching() before set config values');
            return;
        }
        this.setConfig(config);
    };
    /**
     * @private
     * @param {?} config
     * @return {?}
     */
    UserIdleService.prototype.setConfig = /**
     * @private
     * @param {?} config
     * @return {?}
     */
    function (config) {
        if (config.idle) {
            this.idleMillisec = config.idle * 1000;
        }
        if (config.ping) {
            this.pingMillisec = config.ping * 1000;
        }
        if (config.idleSensitivity) {
            this.idleSensitivityMillisec = config.idleSensitivity * 1000;
        }
        if (config.timeout) {
            this.timeout = config.timeout;
        }
    };
    /**
     * Set custom activity events
     *
     * @param customEvents Example: merge(
     *   fromEvent(window, 'mousemove'),
     *   fromEvent(window, 'resize'),
     *   fromEvent(document, 'keydown'),
     *   fromEvent(document, 'touchstart'),
     *   fromEvent(document, 'touchend')
     * )
     */
    /**
     * Set custom activity events
     *
     * @param {?} customEvents Example: merge(
     *   fromEvent(window, 'mousemove'),
     *   fromEvent(window, 'resize'),
     *   fromEvent(document, 'keydown'),
     *   fromEvent(document, 'touchstart'),
     *   fromEvent(document, 'touchend')
     * )
     * @return {?}
     */
    UserIdleService.prototype.setCustomActivityEvents = /**
     * Set custom activity events
     *
     * @param {?} customEvents Example: merge(
     *   fromEvent(window, 'mousemove'),
     *   fromEvent(window, 'resize'),
     *   fromEvent(document, 'keydown'),
     *   fromEvent(document, 'touchstart'),
     *   fromEvent(document, 'touchend')
     * )
     * @return {?}
     */
    function (customEvents) {
        if (this.idleSubscription && !this.idleSubscription.closed) {
            console.error('Call stopWatching() before set custom activity events');
            return;
        }
        this.activityEvents$ = customEvents;
    };
    /**
     * Setup timer.
     *
     * Counts every seconds and return n+1 and fire timeout for last count.
     * @param timeout Timeout in seconds.
     */
    /**
     * Setup timer.
     *
     * Counts every seconds and return n+1 and fire timeout for last count.
     * @protected
     * @param {?} timeout Timeout in seconds.
     * @return {?}
     */
    UserIdleService.prototype.setupTimer = /**
     * Setup timer.
     *
     * Counts every seconds and return n+1 and fire timeout for last count.
     * @protected
     * @param {?} timeout Timeout in seconds.
     * @return {?}
     */
    function (timeout) {
        var _this = this;
        this._ngZone.runOutsideAngular(function () {
            _this.timer$ = interval(1000).pipe(take(timeout), map(function () { return 1; }), scan(function (acc, n) { return acc + n; }), tap(function (count) {
                if (count === timeout) {
                    _this.timeout$.next(true);
                }
            }));
        });
    };
    /**
     * Setup ping.
     *
     * Pings every ping-seconds only if is not timeout.
     * @param pingMillisec
     */
    /**
     * Setup ping.
     *
     * Pings every ping-seconds only if is not timeout.
     * @protected
     * @param {?} pingMillisec
     * @return {?}
     */
    UserIdleService.prototype.setupPing = /**
     * Setup ping.
     *
     * Pings every ping-seconds only if is not timeout.
     * @protected
     * @param {?} pingMillisec
     * @return {?}
     */
    function (pingMillisec) {
        var _this = this;
        this.ping$ = interval(pingMillisec).pipe(filter(function () { return !_this.isTimeout; }));
    };
    UserIdleService.decorators = [
        { type: Injectable, args: [{
                    providedIn: 'root'
                },] },
    ];
    /** @nocollapse */
    UserIdleService.ctorParameters = function () { return [
        { type: UserIdleConfig, decorators: [{ type: Optional }] },
        { type: NgZone }
    ]; };
    /** @nocollapse */ UserIdleService.ngInjectableDef = defineInjectable({ factory: function UserIdleService_Factory() { return new UserIdleService(inject(UserIdleConfig, 8), inject(NgZone)); }, token: UserIdleService, providedIn: "root" });
    return UserIdleService;
}());

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
var UserIdleModule = /** @class */ (function () {
    function UserIdleModule() {
    }
    /**
     * @param {?} config
     * @return {?}
     */
    UserIdleModule.forRoot = /**
     * @param {?} config
     * @return {?}
     */
    function (config) {
        return {
            ngModule: UserIdleModule,
            providers: [
                { provide: UserIdleConfig, useValue: config }
            ]
        };
    };
    UserIdleModule.decorators = [
        { type: NgModule, args: [{
                    imports: []
                },] },
    ];
    return UserIdleModule;
}());

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */

/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */

export { UserIdleService, UserIdleConfig, UserIdleModule };

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW5ndWxhci11c2VyLWlkbGUuanMubWFwIiwic291cmNlcyI6WyJuZzovL2FuZ3VsYXItdXNlci1pZGxlL2xpYi9hbmd1bGFyLXVzZXItaWRsZS5jb25maWcudHMiLCJuZzovL2FuZ3VsYXItdXNlci1pZGxlL2xpYi9hbmd1bGFyLXVzZXItaWRsZS5zZXJ2aWNlLnRzIiwibmc6Ly9hbmd1bGFyLXVzZXItaWRsZS9saWIvYW5ndWxhci11c2VyLWlkbGUubW9kdWxlLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBjbGFzcyBVc2VySWRsZUNvbmZpZyB7XG4gIC8qKlxuICAgKiBJZGxlIHZhbHVlIGluIHNlY29uZHMuXG4gICAqL1xuICBpZGxlPzogbnVtYmVyO1xuICAvKipcbiAgICogVGltZW91dCB2YWx1ZSBpbiBzZWNvbmRzLlxuICAgKi9cbiAgdGltZW91dD86IG51bWJlcjtcbiAgLyoqXG4gICAqIFBpbmcgdmFsdWUgaW4gc2Vjb25kcy5cbiAgICovXG4gIHBpbmc/OiBudW1iZXI7XG4gIC8qKlxuICAgKiBJZGxlU2Vuc2l0aXZpdHkgdGltZSB0aGF0IGFjdGl2aXR5IG11c3QgcmVtYWluIGJlbG93IHRoZSBpZGxlIGRldGVjdGlvbiB0aHJlc2hvbGQgYmVmb3JlXG4gICAqIGlkbGUgYnVmZmVyIHRpbWVyIGNvdW50IHVzZXIncyBhY3Rpdml0eSBhY3Rpb25zLCBpbiBzZWNvbmRzLlxuICAgKi9cbiAgaWRsZVNlbnNpdGl2aXR5PzogbnVtYmVyO1xufVxuIiwiaW1wb3J0IHsgSW5qZWN0YWJsZSwgTmdab25lLCBPcHRpb25hbCB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtcbiAgZnJvbSxcbiAgZnJvbUV2ZW50LFxuICBpbnRlcnZhbCxcbiAgbWVyZ2UsXG4gIE9ic2VydmFibGUsXG4gIG9mLFxuICBTdWJqZWN0LFxuICBTdWJzY3JpcHRpb24sXG4gIHRpbWVyXG59IGZyb20gJ3J4anMnO1xuaW1wb3J0IHtcbiAgYnVmZmVyVGltZSxcbiAgZGlzdGluY3RVbnRpbENoYW5nZWQsXG4gIGZpbHRlcixcbiAgZmluYWxpemUsXG4gIG1hcCxcbiAgc2NhbixcbiAgc3dpdGNoTWFwLFxuICB0YWtlLFxuICB0YWtlVW50aWwsXG4gIHRhcFxufSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5pbXBvcnQgeyBVc2VySWRsZUNvbmZpZyB9IGZyb20gJy4vYW5ndWxhci11c2VyLWlkbGUuY29uZmlnJztcblxuLyoqXG4gKiBVc2VyJ3MgaWRsZSBzZXJ2aWNlLlxuICovXG5ASW5qZWN0YWJsZSh7XG4gIHByb3ZpZGVkSW46ICdyb290J1xufSlcbmV4cG9ydCBjbGFzcyBVc2VySWRsZVNlcnZpY2Uge1xuICBwaW5nJDogT2JzZXJ2YWJsZTxhbnk+O1xuXG4gIC8qKlxuICAgKiBFdmVudHMgdGhhdCBjYW4gaW50ZXJydXB0cyB1c2VyJ3MgaW5hY3Rpdml0eSB0aW1lci5cbiAgICovXG4gIHByb3RlY3RlZCBhY3Rpdml0eUV2ZW50cyQ6IE9ic2VydmFibGU8YW55PjtcblxuICBwcm90ZWN0ZWQgdGltZXJTdGFydCQgPSBuZXcgU3ViamVjdDxib29sZWFuPigpO1xuICBwcm90ZWN0ZWQgaWRsZURldGVjdGVkJCA9IG5ldyBTdWJqZWN0PGJvb2xlYW4+KCk7XG4gIHByb3RlY3RlZCB0aW1lb3V0JCA9IG5ldyBTdWJqZWN0PGJvb2xlYW4+KCk7XG4gIHByb3RlY3RlZCBpZGxlJDogT2JzZXJ2YWJsZTxhbnk+O1xuICBwcm90ZWN0ZWQgdGltZXIkOiBPYnNlcnZhYmxlPGFueT47XG4gIC8qKlxuICAgKiBJZGxlIHZhbHVlIGluIG1pbGxpc2Vjb25kcy5cbiAgICogRGVmYXVsdCBlcXVhbHMgdG8gMTAgbWludXRlcy5cbiAgICovXG4gIHByb3RlY3RlZCBpZGxlTWlsbGlzZWMgPSA2MDAgKiAxMDAwO1xuICAvKipcbiAgICogSWRsZSBidWZmZXIgd2FpdCB0aW1lIG1pbGxpc2Vjb25kcyB0byBjb2xsZWN0IHVzZXIgYWN0aW9uXG4gICAqIERlZmF1bHQgZXF1YWxzIHRvIDEgU2VjLlxuICAgKi9cbiAgcHJvdGVjdGVkIGlkbGVTZW5zaXRpdml0eU1pbGxpc2VjID0gMTAwMDtcbiAgLyoqXG4gICAqIFRpbWVvdXQgdmFsdWUgaW4gc2Vjb25kcy5cbiAgICogRGVmYXVsdCBlcXVhbHMgdG8gNSBtaW51dGVzLlxuICAgKi9cbiAgcHJvdGVjdGVkIHRpbWVvdXQgPSAzMDA7XG4gIC8qKlxuICAgKiBQaW5nIHZhbHVlIGluIG1pbGxpc2Vjb25kcy5cbiAgICogRGVmYXVsdCBlcXVhbHMgdG8gMiBtaW51dGVzLlxuICAgKi9cbiAgcHJvdGVjdGVkIHBpbmdNaWxsaXNlYyA9IDEyMCAqIDEwMDA7XG4gIC8qKlxuICAgKiBUaW1lb3V0IHN0YXR1cy5cbiAgICovXG4gIHByb3RlY3RlZCBpc1RpbWVvdXQ6IGJvb2xlYW47XG4gIC8qKlxuICAgKiBUaW1lciBvZiB1c2VyJ3MgaW5hY3Rpdml0eSBpcyBpbiBwcm9ncmVzcy5cbiAgICovXG4gIHByb3RlY3RlZCBpc0luYWN0aXZpdHlUaW1lcjogYm9vbGVhbjtcbiAgcHJvdGVjdGVkIGlzSWRsZURldGVjdGVkOiBib29sZWFuO1xuXG4gIHByb3RlY3RlZCBpZGxlU3Vic2NyaXB0aW9uOiBTdWJzY3JpcHRpb247XG5cbiAgY29uc3RydWN0b3IoQE9wdGlvbmFsKCkgY29uZmlnOiBVc2VySWRsZUNvbmZpZywgcHJpdmF0ZSBfbmdab25lOiBOZ1pvbmUpIHtcbiAgICBpZiAoY29uZmlnKSB7XG4gICAgICB0aGlzLnNldENvbmZpZyhjb25maWcpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTdGFydCB3YXRjaGluZyBmb3IgdXNlciBpZGxlIGFuZCBzZXR1cCB0aW1lciBhbmQgcGluZy5cbiAgICovXG4gIHN0YXJ0V2F0Y2hpbmcoKSB7XG4gICAgaWYgKCF0aGlzLmFjdGl2aXR5RXZlbnRzJCkge1xuICAgICAgdGhpcy5hY3Rpdml0eUV2ZW50cyQgPSBtZXJnZShcbiAgICAgICAgZnJvbUV2ZW50KHdpbmRvdywgJ21vdXNlbW92ZScpLFxuICAgICAgICBmcm9tRXZlbnQod2luZG93LCAncmVzaXplJyksXG4gICAgICAgIGZyb21FdmVudChkb2N1bWVudCwgJ2tleWRvd24nKVxuICAgICAgKTtcbiAgICB9XG5cbiAgICB0aGlzLmlkbGUkID0gZnJvbSh0aGlzLmFjdGl2aXR5RXZlbnRzJCk7XG5cbiAgICBpZiAodGhpcy5pZGxlU3Vic2NyaXB0aW9uKSB7XG4gICAgICB0aGlzLmlkbGVTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICB9XG5cbiAgICAvLyBJZiBhbnkgb2YgdXNlciBldmVudHMgaXMgbm90IGFjdGl2ZSBmb3IgaWRsZS1zZWNvbmRzIHdoZW4gc3RhcnQgdGltZXIuXG4gICAgdGhpcy5pZGxlU3Vic2NyaXB0aW9uID0gdGhpcy5pZGxlJFxuICAgICAgLnBpcGUoXG4gICAgICAgIGJ1ZmZlclRpbWUodGhpcy5pZGxlU2Vuc2l0aXZpdHlNaWxsaXNlYyksIC8vIFN0YXJ0aW5nIHBvaW50IG9mIGRldGVjdGluZyBvZiB1c2VyJ3MgaW5hY3Rpdml0eVxuICAgICAgICBmaWx0ZXIoXG4gICAgICAgICAgYXJyID0+ICFhcnIubGVuZ3RoICYmICF0aGlzLmlzSWRsZURldGVjdGVkICYmICF0aGlzLmlzSW5hY3Rpdml0eVRpbWVyXG4gICAgICAgICksXG4gICAgICAgIHRhcCgoKSA9PiB7XG4gICAgICAgICAgdGhpcy5pc0lkbGVEZXRlY3RlZCA9IHRydWU7XG4gICAgICAgICAgdGhpcy5pZGxlRGV0ZWN0ZWQkLm5leHQodHJ1ZSk7XG4gICAgICAgIH0pLFxuICAgICAgICBzd2l0Y2hNYXAoKCkgPT5cbiAgICAgICAgICB0aGlzLl9uZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT5cbiAgICAgICAgICAgIGludGVydmFsKDEwMDApLnBpcGUoXG4gICAgICAgICAgICAgIHRha2VVbnRpbChcbiAgICAgICAgICAgICAgICBtZXJnZShcbiAgICAgICAgICAgICAgICAgIHRoaXMuYWN0aXZpdHlFdmVudHMkLFxuICAgICAgICAgICAgICAgICAgdGltZXIodGhpcy5pZGxlTWlsbGlzZWMpLnBpcGUoXG4gICAgICAgICAgICAgICAgICAgIHRhcCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgdGhpcy5pc0luYWN0aXZpdHlUaW1lciA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgdGhpcy50aW1lclN0YXJ0JC5uZXh0KHRydWUpO1xuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgKSxcbiAgICAgICAgICAgICAgZmluYWxpemUoKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuaXNJZGxlRGV0ZWN0ZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB0aGlzLmlkbGVEZXRlY3RlZCQubmV4dChmYWxzZSk7XG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICApXG4gICAgICAgICAgKVxuICAgICAgICApXG4gICAgICApXG4gICAgICAuc3Vic2NyaWJlKCk7XG5cbiAgICB0aGlzLnNldHVwVGltZXIodGhpcy50aW1lb3V0KTtcbiAgICB0aGlzLnNldHVwUGluZyh0aGlzLnBpbmdNaWxsaXNlYyk7XG4gIH1cblxuICBzdG9wV2F0Y2hpbmcoKSB7XG4gICAgdGhpcy5zdG9wVGltZXIoKTtcbiAgICBpZiAodGhpcy5pZGxlU3Vic2NyaXB0aW9uKSB7XG4gICAgICB0aGlzLmlkbGVTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICB9XG4gIH1cblxuICBzdG9wVGltZXIoKSB7XG4gICAgdGhpcy5pc0luYWN0aXZpdHlUaW1lciA9IGZhbHNlO1xuICAgIHRoaXMudGltZXJTdGFydCQubmV4dChmYWxzZSk7XG4gIH1cblxuICByZXNldFRpbWVyKCkge1xuICAgIHRoaXMuc3RvcFRpbWVyKCk7XG4gICAgdGhpcy5pc1RpbWVvdXQgPSBmYWxzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm4gb2JzZXJ2YWJsZSBmb3IgdGltZXIncyBjb3VudGRvd24gbnVtYmVyIHRoYXQgZW1pdHMgYWZ0ZXIgaWRsZS5cbiAgICovXG4gIG9uVGltZXJTdGFydCgpOiBPYnNlcnZhYmxlPG51bWJlcj4ge1xuICAgIHJldHVybiB0aGlzLnRpbWVyU3RhcnQkLnBpcGUoXG4gICAgICBkaXN0aW5jdFVudGlsQ2hhbmdlZCgpLFxuICAgICAgc3dpdGNoTWFwKHN0YXJ0ID0+IChzdGFydCA/IHRoaXMudGltZXIkIDogb2YobnVsbCkpKVxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJuIG9ic2VydmFibGUgZm9yIGlkbGUgc3RhdHVzIGNoYW5nZWRcbiAgICovXG4gIG9uSWRsZVN0YXR1c0NoYW5nZWQoKTogT2JzZXJ2YWJsZTxib29sZWFuPiB7XG4gICAgcmV0dXJuIHRoaXMuaWRsZURldGVjdGVkJC5hc09ic2VydmFibGUoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm4gb2JzZXJ2YWJsZSBmb3IgdGltZW91dCBpcyBmaXJlZC5cbiAgICovXG4gIG9uVGltZW91dCgpOiBPYnNlcnZhYmxlPGJvb2xlYW4+IHtcbiAgICByZXR1cm4gdGhpcy50aW1lb3V0JC5waXBlKFxuICAgICAgZmlsdGVyKHRpbWVvdXQgPT4gISF0aW1lb3V0KSxcbiAgICAgIHRhcCgoKSA9PiAodGhpcy5pc1RpbWVvdXQgPSB0cnVlKSksXG4gICAgICBtYXAoKCkgPT4gdHJ1ZSlcbiAgICApO1xuICB9XG5cbiAgZ2V0Q29uZmlnVmFsdWUoKTogVXNlcklkbGVDb25maWcge1xuICAgIHJldHVybiB7XG4gICAgICBpZGxlOiB0aGlzLmlkbGVNaWxsaXNlYyxcbiAgICAgIGlkbGVTZW5zaXRpdml0eTogdGhpcy5pZGxlU2Vuc2l0aXZpdHlNaWxsaXNlYyxcbiAgICAgIHRpbWVvdXQ6IHRoaXMudGltZW91dCxcbiAgICAgIHBpbmc6IHRoaXMucGluZ01pbGxpc2VjXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgY29uZmlnIHZhbHVlcy5cbiAgICogQHBhcmFtIGNvbmZpZ1xuICAgKi9cbiAgc2V0Q29uZmlnVmFsdWVzKGNvbmZpZzogVXNlcklkbGVDb25maWcpIHtcbiAgICBpZiAodGhpcy5pZGxlU3Vic2NyaXB0aW9uICYmICF0aGlzLmlkbGVTdWJzY3JpcHRpb24uY2xvc2VkKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdDYWxsIHN0b3BXYXRjaGluZygpIGJlZm9yZSBzZXQgY29uZmlnIHZhbHVlcycpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuc2V0Q29uZmlnKGNvbmZpZyk7XG4gIH1cblxuICBwcml2YXRlIHNldENvbmZpZyhjb25maWc6IFVzZXJJZGxlQ29uZmlnKSB7XG4gICAgaWYgKGNvbmZpZy5pZGxlKSB7XG4gICAgICB0aGlzLmlkbGVNaWxsaXNlYyA9IGNvbmZpZy5pZGxlICogMTAwMDtcbiAgICB9XG4gICAgaWYgKGNvbmZpZy5waW5nKSB7XG4gICAgICB0aGlzLnBpbmdNaWxsaXNlYyA9IGNvbmZpZy5waW5nICogMTAwMDtcbiAgICB9XG4gICAgaWYgKGNvbmZpZy5pZGxlU2Vuc2l0aXZpdHkpIHtcbiAgICAgIHRoaXMuaWRsZVNlbnNpdGl2aXR5TWlsbGlzZWMgPSBjb25maWcuaWRsZVNlbnNpdGl2aXR5ICogMTAwMDtcbiAgICB9XG4gICAgaWYgKGNvbmZpZy50aW1lb3V0KSB7XG4gICAgICB0aGlzLnRpbWVvdXQgPSBjb25maWcudGltZW91dDtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2V0IGN1c3RvbSBhY3Rpdml0eSBldmVudHNcbiAgICpcbiAgICogQHBhcmFtIGN1c3RvbUV2ZW50cyBFeGFtcGxlOiBtZXJnZShcbiAgICogICBmcm9tRXZlbnQod2luZG93LCAnbW91c2Vtb3ZlJyksXG4gICAqICAgZnJvbUV2ZW50KHdpbmRvdywgJ3Jlc2l6ZScpLFxuICAgKiAgIGZyb21FdmVudChkb2N1bWVudCwgJ2tleWRvd24nKSxcbiAgICogICBmcm9tRXZlbnQoZG9jdW1lbnQsICd0b3VjaHN0YXJ0JyksXG4gICAqICAgZnJvbUV2ZW50KGRvY3VtZW50LCAndG91Y2hlbmQnKVxuICAgKiApXG4gICAqL1xuICBzZXRDdXN0b21BY3Rpdml0eUV2ZW50cyhjdXN0b21FdmVudHM6IE9ic2VydmFibGU8YW55Pikge1xuICAgIGlmICh0aGlzLmlkbGVTdWJzY3JpcHRpb24gJiYgIXRoaXMuaWRsZVN1YnNjcmlwdGlvbi5jbG9zZWQpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0NhbGwgc3RvcFdhdGNoaW5nKCkgYmVmb3JlIHNldCBjdXN0b20gYWN0aXZpdHkgZXZlbnRzJyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5hY3Rpdml0eUV2ZW50cyQgPSBjdXN0b21FdmVudHM7XG4gIH1cblxuICAvKipcbiAgICogU2V0dXAgdGltZXIuXG4gICAqXG4gICAqIENvdW50cyBldmVyeSBzZWNvbmRzIGFuZCByZXR1cm4gbisxIGFuZCBmaXJlIHRpbWVvdXQgZm9yIGxhc3QgY291bnQuXG4gICAqIEBwYXJhbSB0aW1lb3V0IFRpbWVvdXQgaW4gc2Vjb25kcy5cbiAgICovXG4gIHByb3RlY3RlZCBzZXR1cFRpbWVyKHRpbWVvdXQ6IG51bWJlcikge1xuICAgIHRoaXMuX25nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB7XG4gICAgICB0aGlzLnRpbWVyJCA9IGludGVydmFsKDEwMDApLnBpcGUoXG4gICAgICAgIHRha2UodGltZW91dCksXG4gICAgICAgIG1hcCgoKSA9PiAxKSxcbiAgICAgICAgc2NhbigoYWNjLCBuKSA9PiBhY2MgKyBuKSxcbiAgICAgICAgdGFwKGNvdW50ID0+IHtcbiAgICAgICAgICBpZiAoY291bnQgPT09IHRpbWVvdXQpIHtcbiAgICAgICAgICAgIHRoaXMudGltZW91dCQubmV4dCh0cnVlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICApO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHVwIHBpbmcuXG4gICAqXG4gICAqIFBpbmdzIGV2ZXJ5IHBpbmctc2Vjb25kcyBvbmx5IGlmIGlzIG5vdCB0aW1lb3V0LlxuICAgKiBAcGFyYW0gcGluZ01pbGxpc2VjXG4gICAqL1xuICBwcm90ZWN0ZWQgc2V0dXBQaW5nKHBpbmdNaWxsaXNlYzogbnVtYmVyKSB7XG4gICAgdGhpcy5waW5nJCA9IGludGVydmFsKHBpbmdNaWxsaXNlYykucGlwZShmaWx0ZXIoKCkgPT4gIXRoaXMuaXNUaW1lb3V0KSk7XG4gIH1cbn1cbiIsImltcG9ydCB7IE1vZHVsZVdpdGhQcm92aWRlcnMsIE5nTW9kdWxlIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBVc2VySWRsZUNvbmZpZyB9IGZyb20gJy4vYW5ndWxhci11c2VyLWlkbGUuY29uZmlnJztcblxuQE5nTW9kdWxlKHtcbiAgaW1wb3J0czogW11cbn0pXG5leHBvcnQgY2xhc3MgVXNlcklkbGVNb2R1bGUge1xuICBzdGF0aWMgZm9yUm9vdChjb25maWc6IFVzZXJJZGxlQ29uZmlnKTogTW9kdWxlV2l0aFByb3ZpZGVycyB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG5nTW9kdWxlOiBVc2VySWRsZU1vZHVsZSxcbiAgICAgIHByb3ZpZGVyczogW1xuICAgICAgICB7cHJvdmlkZTogVXNlcklkbGVDb25maWcsIHVzZVZhbHVlOiBjb25maWd9XG4gICAgICBdXG4gICAgfTtcbiAgfVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7O0FBQUE7SUFBQTtLQWtCQztJQUFELHFCQUFDO0NBQUE7Ozs7OztBQ2xCRDs7O0FBNkJBO0lBZ0RFLHlCQUF3QixNQUFzQixFQUFVLE9BQWU7UUFBZixZQUFPLEdBQVAsT0FBTyxDQUFRO1FBckM3RCxnQkFBVyxHQUFHLElBQUksT0FBTyxFQUFXLENBQUM7UUFDckMsa0JBQWEsR0FBRyxJQUFJLE9BQU8sRUFBVyxDQUFDO1FBQ3ZDLGFBQVEsR0FBRyxJQUFJLE9BQU8sRUFBVyxDQUFDOzs7OztRQU9sQyxpQkFBWSxHQUFHLEdBQUcsR0FB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
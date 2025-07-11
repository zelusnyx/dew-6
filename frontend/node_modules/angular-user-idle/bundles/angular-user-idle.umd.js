(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@angular/core'), require('rxjs'), require('rxjs/operators')) :
    typeof define === 'function' && define.amd ? define('angular-user-idle', ['exports', '@angular/core', 'rxjs', 'rxjs/operators'], factory) :
    (factory((global['angular-user-idle'] = {}),global.ng.core,null,global.Rx.Observable.prototype));
}(this, (function (exports,i0,rxjs,operators) { 'use strict';

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
            this.timerStart$ = new rxjs.Subject();
            this.idleDetected$ = new rxjs.Subject();
            this.timeout$ = new rxjs.Subject();
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
                    this.activityEvents$ = rxjs.merge(rxjs.fromEvent(window, 'mousemove'), rxjs.fromEvent(window, 'resize'), rxjs.fromEvent(document, 'keydown'));
                }
                this.idle$ = rxjs.from(this.activityEvents$);
                if (this.idleSubscription) {
                    this.idleSubscription.unsubscribe();
                }
                // If any of user events is not active for idle-seconds when start timer.
                this.idleSubscription = this.idle$
                    .pipe(operators.bufferTime(this.idleSensitivityMillisec), // Starting point of detecting of user's inactivity
                operators.filter(function (arr) { return !arr.length && !_this.isIdleDetected && !_this.isInactivityTimer; }), operators.tap(function () {
                    _this.isIdleDetected = true;
                    _this.idleDetected$.next(true);
                }), operators.switchMap(function () {
                    return _this._ngZone.runOutsideAngular(function () {
                        return rxjs.interval(1000).pipe(operators.takeUntil(rxjs.merge(_this.activityEvents$, rxjs.timer(_this.idleMillisec).pipe(operators.tap(function () {
                            _this.isInactivityTimer = true;
                            _this.timerStart$.next(true);
                        })))), operators.finalize(function () {
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
                return this.timerStart$.pipe(operators.distinctUntilChanged(), operators.switchMap(function (start) { return (start ? _this.timer$ : rxjs.of(null)); }));
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
                return this.timeout$.pipe(operators.filter(function (timeout) { return !!timeout; }), operators.tap(function () { return (_this.isTimeout = true); }), operators.map(function () { return true; }));
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
                    _this.timer$ = rxjs.interval(1000).pipe(operators.take(timeout), operators.map(function () { return 1; }), operators.scan(function (acc, n) { return acc + n; }), operators.tap(function (count) {
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
                this.ping$ = rxjs.interval(pingMillisec).pipe(operators.filter(function () { return !_this.isTimeout; }));
            };
        UserIdleService.decorators = [
            { type: i0.Injectable, args: [{
                        providedIn: 'root'
                    },] },
        ];
        /** @nocollapse */
        UserIdleService.ctorParameters = function () {
            return [
                { type: UserIdleConfig, decorators: [{ type: i0.Optional }] },
                { type: i0.NgZone }
            ];
        };
        /** @nocollapse */ UserIdleService.ngInjectableDef = i0.defineInjectable({ factory: function UserIdleService_Factory() { return new UserIdleService(i0.inject(UserIdleConfig, 8), i0.inject(i0.NgZone)); }, token: UserIdleService, providedIn: "root" });
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
            { type: i0.NgModule, args: [{
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

    exports.UserIdleService = UserIdleService;
    exports.UserIdleConfig = UserIdleConfig;
    exports.UserIdleModule = UserIdleModule;

    Object.defineProperty(exports, '__esModule', { value: true });

})));

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW5ndWxhci11c2VyLWlkbGUudW1kLmpzLm1hcCIsInNvdXJjZXMiOlsibmc6Ly9hbmd1bGFyLXVzZXItaWRsZS9saWIvYW5ndWxhci11c2VyLWlkbGUuY29uZmlnLnRzIiwibmc6Ly9hbmd1bGFyLXVzZXItaWRsZS9saWIvYW5ndWxhci11c2VyLWlkbGUuc2VydmljZS50cyIsIm5nOi8vYW5ndWxhci11c2VyLWlkbGUvbGliL2FuZ3VsYXItdXNlci1pZGxlLm1vZHVsZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgY2xhc3MgVXNlcklkbGVDb25maWcge1xuICAvKipcbiAgICogSWRsZSB2YWx1ZSBpbiBzZWNvbmRzLlxuICAgKi9cbiAgaWRsZT86IG51bWJlcjtcbiAgLyoqXG4gICAqIFRpbWVvdXQgdmFsdWUgaW4gc2Vjb25kcy5cbiAgICovXG4gIHRpbWVvdXQ/OiBudW1iZXI7XG4gIC8qKlxuICAgKiBQaW5nIHZhbHVlIGluIHNlY29uZHMuXG4gICAqL1xuICBwaW5nPzogbnVtYmVyO1xuICAvKipcbiAgICogSWRsZVNlbnNpdGl2aXR5IHRpbWUgdGhhdCBhY3Rpdml0eSBtdXN0IHJlbWFpbiBiZWxvdyB0aGUgaWRsZSBkZXRlY3Rpb24gdGhyZXNob2xkIGJlZm9yZVxuICAgKiBpZGxlIGJ1ZmZlciB0aW1lciBjb3VudCB1c2VyJ3MgYWN0aXZpdHkgYWN0aW9ucywgaW4gc2Vjb25kcy5cbiAgICovXG4gIGlkbGVTZW5zaXRpdml0eT86IG51bWJlcjtcbn1cbiIsImltcG9ydCB7IEluamVjdGFibGUsIE5nWm9uZSwgT3B0aW9uYWwgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7XG4gIGZyb20sXG4gIGZyb21FdmVudCxcbiAgaW50ZXJ2YWwsXG4gIG1lcmdlLFxuICBPYnNlcnZhYmxlLFxuICBvZixcbiAgU3ViamVjdCxcbiAgU3Vic2NyaXB0aW9uLFxuICB0aW1lclxufSBmcm9tICdyeGpzJztcbmltcG9ydCB7XG4gIGJ1ZmZlclRpbWUsXG4gIGRpc3RpbmN0VW50aWxDaGFuZ2VkLFxuICBmaWx0ZXIsXG4gIGZpbmFsaXplLFxuICBtYXAsXG4gIHNjYW4sXG4gIHN3aXRjaE1hcCxcbiAgdGFrZSxcbiAgdGFrZVVudGlsLFxuICB0YXBcbn0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuaW1wb3J0IHsgVXNlcklkbGVDb25maWcgfSBmcm9tICcuL2FuZ3VsYXItdXNlci1pZGxlLmNvbmZpZyc7XG5cbi8qKlxuICogVXNlcidzIGlkbGUgc2VydmljZS5cbiAqL1xuQEluamVjdGFibGUoe1xuICBwcm92aWRlZEluOiAncm9vdCdcbn0pXG5leHBvcnQgY2xhc3MgVXNlcklkbGVTZXJ2aWNlIHtcbiAgcGluZyQ6IE9ic2VydmFibGU8YW55PjtcblxuICAvKipcbiAgICogRXZlbnRzIHRoYXQgY2FuIGludGVycnVwdHMgdXNlcidzIGluYWN0aXZpdHkgdGltZXIuXG4gICAqL1xuICBwcm90ZWN0ZWQgYWN0aXZpdHlFdmVudHMkOiBPYnNlcnZhYmxlPGFueT47XG5cbiAgcHJvdGVjdGVkIHRpbWVyU3RhcnQkID0gbmV3IFN1YmplY3Q8Ym9vbGVhbj4oKTtcbiAgcHJvdGVjdGVkIGlkbGVEZXRlY3RlZCQgPSBuZXcgU3ViamVjdDxib29sZWFuPigpO1xuICBwcm90ZWN0ZWQgdGltZW91dCQgPSBuZXcgU3ViamVjdDxib29sZWFuPigpO1xuICBwcm90ZWN0ZWQgaWRsZSQ6IE9ic2VydmFibGU8YW55PjtcbiAgcHJvdGVjdGVkIHRpbWVyJDogT2JzZXJ2YWJsZTxhbnk+O1xuICAvKipcbiAgICogSWRsZSB2YWx1ZSBpbiBtaWxsaXNlY29uZHMuXG4gICAqIERlZmF1bHQgZXF1YWxzIHRvIDEwIG1pbnV0ZXMuXG4gICAqL1xuICBwcm90ZWN0ZWQgaWRsZU1pbGxpc2VjID0gNjAwICogMTAwMDtcbiAgLyoqXG4gICAqIElkbGUgYnVmZmVyIHdhaXQgdGltZSBtaWxsaXNlY29uZHMgdG8gY29sbGVjdCB1c2VyIGFjdGlvblxuICAgKiBEZWZhdWx0IGVxdWFscyB0byAxIFNlYy5cbiAgICovXG4gIHByb3RlY3RlZCBpZGxlU2Vuc2l0aXZpdHlNaWxsaXNlYyA9IDEwMDA7XG4gIC8qKlxuICAgKiBUaW1lb3V0IHZhbHVlIGluIHNlY29uZHMuXG4gICAqIERlZmF1bHQgZXF1YWxzIHRvIDUgbWludXRlcy5cbiAgICovXG4gIHByb3RlY3RlZCB0aW1lb3V0ID0gMzAwO1xuICAvKipcbiAgICogUGluZyB2YWx1ZSBpbiBtaWxsaXNlY29uZHMuXG4gICAqIERlZmF1bHQgZXF1YWxzIHRvIDIgbWludXRlcy5cbiAgICovXG4gIHByb3RlY3RlZCBwaW5nTWlsbGlzZWMgPSAxMjAgKiAxMDAwO1xuICAvKipcbiAgICogVGltZW91dCBzdGF0dXMuXG4gICAqL1xuICBwcm90ZWN0ZWQgaXNUaW1lb3V0OiBib29sZWFuO1xuICAvKipcbiAgICogVGltZXIgb2YgdXNlcidzIGluYWN0aXZpdHkgaXMgaW4gcHJvZ3Jlc3MuXG4gICAqL1xuICBwcm90ZWN0ZWQgaXNJbmFjdGl2aXR5VGltZXI6IGJvb2xlYW47XG4gIHByb3RlY3RlZCBpc0lkbGVEZXRlY3RlZDogYm9vbGVhbjtcblxuICBwcm90ZWN0ZWQgaWRsZVN1YnNjcmlwdGlvbjogU3Vic2NyaXB0aW9uO1xuXG4gIGNvbnN0cnVjdG9yKEBPcHRpb25hbCgpIGNvbmZpZzogVXNlcklkbGVDb25maWcsIHByaXZhdGUgX25nWm9uZTogTmdab25lKSB7XG4gICAgaWYgKGNvbmZpZykge1xuICAgICAgdGhpcy5zZXRDb25maWcoY29uZmlnKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU3RhcnQgd2F0Y2hpbmcgZm9yIHVzZXIgaWRsZSBhbmQgc2V0dXAgdGltZXIgYW5kIHBpbmcuXG4gICAqL1xuICBzdGFydFdhdGNoaW5nKCkge1xuICAgIGlmICghdGhpcy5hY3Rpdml0eUV2ZW50cyQpIHtcbiAgICAgIHRoaXMuYWN0aXZpdHlFdmVudHMkID0gbWVyZ2UoXG4gICAgICAgIGZyb21FdmVudCh3aW5kb3csICdtb3VzZW1vdmUnKSxcbiAgICAgICAgZnJvbUV2ZW50KHdpbmRvdywgJ3Jlc2l6ZScpLFxuICAgICAgICBmcm9tRXZlbnQoZG9jdW1lbnQsICdrZXlkb3duJylcbiAgICAgICk7XG4gICAgfVxuXG4gICAgdGhpcy5pZGxlJCA9IGZyb20odGhpcy5hY3Rpdml0eUV2ZW50cyQpO1xuXG4gICAgaWYgKHRoaXMuaWRsZVN1YnNjcmlwdGlvbikge1xuICAgICAgdGhpcy5pZGxlU3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gICAgfVxuXG4gICAgLy8gSWYgYW55IG9mIHVzZXIgZXZlbnRzIGlzIG5vdCBhY3RpdmUgZm9yIGlkbGUtc2Vjb25kcyB3aGVuIHN0YXJ0IHRpbWVyLlxuICAgIHRoaXMuaWRsZVN1YnNjcmlwdGlvbiA9IHRoaXMuaWRsZSRcbiAgICAgIC5waXBlKFxuICAgICAgICBidWZmZXJUaW1lKHRoaXMuaWRsZVNlbnNpdGl2aXR5TWlsbGlzZWMpLCAvLyBTdGFydGluZyBwb2ludCBvZiBkZXRlY3Rpbmcgb2YgdXNlcidzIGluYWN0aXZpdHlcbiAgICAgICAgZmlsdGVyKFxuICAgICAgICAgIGFyciA9PiAhYXJyLmxlbmd0aCAmJiAhdGhpcy5pc0lkbGVEZXRlY3RlZCAmJiAhdGhpcy5pc0luYWN0aXZpdHlUaW1lclxuICAgICAgICApLFxuICAgICAgICB0YXAoKCkgPT4ge1xuICAgICAgICAgIHRoaXMuaXNJZGxlRGV0ZWN0ZWQgPSB0cnVlO1xuICAgICAgICAgIHRoaXMuaWRsZURldGVjdGVkJC5uZXh0KHRydWUpO1xuICAgICAgICB9KSxcbiAgICAgICAgc3dpdGNoTWFwKCgpID0+XG4gICAgICAgICAgdGhpcy5fbmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+XG4gICAgICAgICAgICBpbnRlcnZhbCgxMDAwKS5waXBlKFxuICAgICAgICAgICAgICB0YWtlVW50aWwoXG4gICAgICAgICAgICAgICAgbWVyZ2UoXG4gICAgICAgICAgICAgICAgICB0aGlzLmFjdGl2aXR5RXZlbnRzJCxcbiAgICAgICAgICAgICAgICAgIHRpbWVyKHRoaXMuaWRsZU1pbGxpc2VjKS5waXBlKFxuICAgICAgICAgICAgICAgICAgICB0YXAoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaXNJbmFjdGl2aXR5VGltZXIgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgIHRoaXMudGltZXJTdGFydCQubmV4dCh0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICksXG4gICAgICAgICAgICAgIGZpbmFsaXplKCgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmlzSWRsZURldGVjdGVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgdGhpcy5pZGxlRGV0ZWN0ZWQkLm5leHQoZmFsc2UpO1xuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgKVxuICAgICAgICAgIClcbiAgICAgICAgKVxuICAgICAgKVxuICAgICAgLnN1YnNjcmliZSgpO1xuXG4gICAgdGhpcy5zZXR1cFRpbWVyKHRoaXMudGltZW91dCk7XG4gICAgdGhpcy5zZXR1cFBpbmcodGhpcy5waW5nTWlsbGlzZWMpO1xuICB9XG5cbiAgc3RvcFdhdGNoaW5nKCkge1xuICAgIHRoaXMuc3RvcFRpbWVyKCk7XG4gICAgaWYgKHRoaXMuaWRsZVN1YnNjcmlwdGlvbikge1xuICAgICAgdGhpcy5pZGxlU3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gICAgfVxuICB9XG5cbiAgc3RvcFRpbWVyKCkge1xuICAgIHRoaXMuaXNJbmFjdGl2aXR5VGltZXIgPSBmYWxzZTtcbiAgICB0aGlzLnRpbWVyU3RhcnQkLm5leHQoZmFsc2UpO1xuICB9XG5cbiAgcmVzZXRUaW1lcigpIHtcbiAgICB0aGlzLnN0b3BUaW1lcigpO1xuICAgIHRoaXMuaXNUaW1lb3V0ID0gZmFsc2U7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJuIG9ic2VydmFibGUgZm9yIHRpbWVyJ3MgY291bnRkb3duIG51bWJlciB0aGF0IGVtaXRzIGFmdGVyIGlkbGUuXG4gICAqL1xuICBvblRpbWVyU3RhcnQoKTogT2JzZXJ2YWJsZTxudW1iZXI+IHtcbiAgICByZXR1cm4gdGhpcy50aW1lclN0YXJ0JC5waXBlKFxuICAgICAgZGlzdGluY3RVbnRpbENoYW5nZWQoKSxcbiAgICAgIHN3aXRjaE1hcChzdGFydCA9PiAoc3RhcnQgPyB0aGlzLnRpbWVyJCA6IG9mKG51bGwpKSlcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybiBvYnNlcnZhYmxlIGZvciBpZGxlIHN0YXR1cyBjaGFuZ2VkXG4gICAqL1xuICBvbklkbGVTdGF0dXNDaGFuZ2VkKCk6IE9ic2VydmFibGU8Ym9vbGVhbj4ge1xuICAgIHJldHVybiB0aGlzLmlkbGVEZXRlY3RlZCQuYXNPYnNlcnZhYmxlKCk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJuIG9ic2VydmFibGUgZm9yIHRpbWVvdXQgaXMgZmlyZWQuXG4gICAqL1xuICBvblRpbWVvdXQoKTogT2JzZXJ2YWJsZTxib29sZWFuPiB7XG4gICAgcmV0dXJuIHRoaXMudGltZW91dCQucGlwZShcbiAgICAgIGZpbHRlcih0aW1lb3V0ID0+ICEhdGltZW91dCksXG4gICAgICB0YXAoKCkgPT4gKHRoaXMuaXNUaW1lb3V0ID0gdHJ1ZSkpLFxuICAgICAgbWFwKCgpID0+IHRydWUpXG4gICAgKTtcbiAgfVxuXG4gIGdldENvbmZpZ1ZhbHVlKCk6IFVzZXJJZGxlQ29uZmlnIHtcbiAgICByZXR1cm4ge1xuICAgICAgaWRsZTogdGhpcy5pZGxlTWlsbGlzZWMsXG4gICAgICBpZGxlU2Vuc2l0aXZpdHk6IHRoaXMuaWRsZVNlbnNpdGl2aXR5TWlsbGlzZWMsXG4gICAgICB0aW1lb3V0OiB0aGlzLnRpbWVvdXQsXG4gICAgICBwaW5nOiB0aGlzLnBpbmdNaWxsaXNlY1xuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogU2V0IGNvbmZpZyB2YWx1ZXMuXG4gICAqIEBwYXJhbSBjb25maWdcbiAgICovXG4gIHNldENvbmZpZ1ZhbHVlcyhjb25maWc6IFVzZXJJZGxlQ29uZmlnKSB7XG4gICAgaWYgKHRoaXMuaWRsZVN1YnNjcmlwdGlvbiAmJiAhdGhpcy5pZGxlU3Vic2NyaXB0aW9uLmNsb3NlZCkge1xuICAgICAgY29uc29sZS5lcnJvcignQ2FsbCBzdG9wV2F0Y2hpbmcoKSBiZWZvcmUgc2V0IGNvbmZpZyB2YWx1ZXMnKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLnNldENvbmZpZyhjb25maWcpO1xuICB9XG5cbiAgcHJpdmF0ZSBzZXRDb25maWcoY29uZmlnOiBVc2VySWRsZUNvbmZpZykge1xuICAgIGlmIChjb25maWcuaWRsZSkge1xuICAgICAgdGhpcy5pZGxlTWlsbGlzZWMgPSBjb25maWcuaWRsZSAqIDEwMDA7XG4gICAgfVxuICAgIGlmIChjb25maWcucGluZykge1xuICAgICAgdGhpcy5waW5nTWlsbGlzZWMgPSBjb25maWcucGluZyAqIDEwMDA7XG4gICAgfVxuICAgIGlmIChjb25maWcuaWRsZVNlbnNpdGl2aXR5KSB7XG4gICAgICB0aGlzLmlkbGVTZW5zaXRpdml0eU1pbGxpc2VjID0gY29uZmlnLmlkbGVTZW5zaXRpdml0eSAqIDEwMDA7XG4gICAgfVxuICAgIGlmIChjb25maWcudGltZW91dCkge1xuICAgICAgdGhpcy50aW1lb3V0ID0gY29uZmlnLnRpbWVvdXQ7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNldCBjdXN0b20gYWN0aXZpdHkgZXZlbnRzXG4gICAqXG4gICAqIEBwYXJhbSBjdXN0b21FdmVudHMgRXhhbXBsZTogbWVyZ2UoXG4gICAqICAgZnJvbUV2ZW50KHdpbmRvdywgJ21vdXNlbW92ZScpLFxuICAgKiAgIGZyb21FdmVudCh3aW5kb3csICdyZXNpemUnKSxcbiAgICogICBmcm9tRXZlbnQoZG9jdW1lbnQsICdrZXlkb3duJyksXG4gICAqICAgZnJvbUV2ZW50KGRvY3VtZW50LCAndG91Y2hzdGFydCcpLFxuICAgKiAgIGZyb21FdmVudChkb2N1bWVudCwgJ3RvdWNoZW5kJylcbiAgICogKVxuICAgKi9cbiAgc2V0Q3VzdG9tQWN0aXZpdHlFdmVudHMoY3VzdG9tRXZlbnRzOiBPYnNlcnZhYmxlPGFueT4pIHtcbiAgICBpZiAodGhpcy5pZGxlU3Vic2NyaXB0aW9uICYmICF0aGlzLmlkbGVTdWJzY3JpcHRpb24uY2xvc2VkKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdDYWxsIHN0b3BXYXRjaGluZygpIGJlZm9yZSBzZXQgY3VzdG9tIGFjdGl2aXR5IGV2ZW50cycpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuYWN0aXZpdHlFdmVudHMkID0gY3VzdG9tRXZlbnRzO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHVwIHRpbWVyLlxuICAgKlxuICAgKiBDb3VudHMgZXZlcnkgc2Vjb25kcyBhbmQgcmV0dXJuIG4rMSBhbmQgZmlyZSB0aW1lb3V0IGZvciBsYXN0IGNvdW50LlxuICAgKiBAcGFyYW0gdGltZW91dCBUaW1lb3V0IGluIHNlY29uZHMuXG4gICAqL1xuICBwcm90ZWN0ZWQgc2V0dXBUaW1lcih0aW1lb3V0OiBudW1iZXIpIHtcbiAgICB0aGlzLl9uZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgdGhpcy50aW1lciQgPSBpbnRlcnZhbCgxMDAwKS5waXBlKFxuICAgICAgICB0YWtlKHRpbWVvdXQpLFxuICAgICAgICBtYXAoKCkgPT4gMSksXG4gICAgICAgIHNjYW4oKGFjYywgbikgPT4gYWNjICsgbiksXG4gICAgICAgIHRhcChjb3VudCA9PiB7XG4gICAgICAgICAgaWYgKGNvdW50ID09PSB0aW1lb3V0KSB7XG4gICAgICAgICAgICB0aGlzLnRpbWVvdXQkLm5leHQodHJ1ZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXR1cCBwaW5nLlxuICAgKlxuICAgKiBQaW5ncyBldmVyeSBwaW5nLXNlY29uZHMgb25seSBpZiBpcyBub3QgdGltZW91dC5cbiAgICogQHBhcmFtIHBpbmdNaWxsaXNlY1xuICAgKi9cbiAgcHJvdGVjdGVkIHNldHVwUGluZyhwaW5nTWlsbGlzZWM6IG51bWJlcikge1xuICAgIHRoaXMucGluZyQgPSBpbnRlcnZhbChwaW5nTWlsbGlzZWMpLnBpcGUoZmlsdGVyKCgpID0+ICF0aGlzLmlzVGltZW91dCkpO1xuICB9XG59XG4iLCJpbXBvcnQgeyBNb2R1bGVXaXRoUHJvdmlkZXJzLCBOZ01vZHVsZSB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgVXNlcklkbGVDb25maWcgfSBmcm9tICcuL2FuZ3VsYXItdXNlci1pZGxlLmNvbmZpZyc7XG5cbkBOZ01vZHVsZSh7XG4gIGltcG9ydHM6IFtdXG59KVxuZXhwb3J0IGNsYXNzIFVzZXJJZGxlTW9kdWxlIHtcbiAgc3RhdGljIGZvclJvb3QoY29uZmlnOiBVc2VySWRsZUNvbmZpZyk6IE1vZHVsZVdpdGhQcm92aWRlcnMge1xuICAgIHJldHVybiB7XG4gICAgICBuZ01vZHVsZTogVXNlcklkbGVNb2R1bGUsXG4gICAgICBwcm92aWRlcnM6IFtcbiAgICAgICAge3Byb3ZpZGU6IFVzZXJJZGxlQ29uZmlnLCB1c2VWYWx1ZTogY29uZmlnfVxuICAgICAgXVxuICAgIH07XG4gIH1cbn1cbiJdLCJuYW1lcyI6WyJTdWJqZWN0IiwibWVyZ2UiLCJmcm9tRXZlbnQiLCJmcm9tIiwiYnVmZmVyVGltZSIsImZpbHRlciIsInRhcCIsInN3aXRjaE1hcCIsImludGVydmFsIiwidGFrZVVudGlsIiwidGltZXIiLCJmaW5hbGl6ZSIsImRpc3RpbmN0VW50aWxDaGFuZ2VkIiwib2YiLCJtYXAiLCJ0YWtlIiwic2NhbiIsIkluamVjdGFibGUiLCJPcHRpb25hbCIsIk5nWm9uZSIsIk5nTW9kdWxlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQUE7UUFBQTtTQWtCQztRQUFELHFCQUFDO0lB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
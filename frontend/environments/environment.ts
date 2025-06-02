// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000',
  authRedirectUrl: 'http://localhost:4200/auth/googleoauth2callback',
  googleClientId: '789341153375-qeeo9deuouq9ea3ke4ou0ipqr2gjd0vr.apps.googleusercontent.com',
  googleDriveRedirectUrl: 'http://localhost:4200/auth/googledrivecallback'
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.

## Geocoder

This is a forward and backward geocoder for Black Rock City, NV. All the geo
features come from a general layout file.

### Node

```js
var coder = new Geocoder(layoutFile);
var point = coder.forward("2:00 & Esplanade");
var string = coder.reverse(40.7826, -119.2132);
```

### Preparing up for iOS & Android

1. Install [Browserify](http://browserify.org/).
2. `browserify index.js -o bundle.js` or `browserify index.js | uglifyjs > bundle.js`

### Use in iOS

```objc
NSString *path = [[NSBundle mainBundle] pathForResource:@"bundle" ofType:@"js"];

NSString *string = [NSString stringWithContentsOfFile:path encoding:NSUTF8StringEncoding error:nil];

//This is necessary because of browserify
string = [NSString stringWithFormat:@"var window = this; %@",string];

context = [[JSContext alloc] init];

[context evaluateScript:string];
[context evaluateScript:@"var coder = prepare();"];
```

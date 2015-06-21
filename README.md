# geocoder.js

Fast offline coarse Geocoder based on GeoNames data.

## Usage

```js
var geocoder = require('geocoder');

geocoder('Big Apple', function (location) {
	/*
	{
		id: '5128581',
		name: 'New York City',
		country: 'US',
		latitude: '40.71427',
		longitude: '-74.00597',
		alternate: '0',
		population: '8175133'
	}
	*/

	console.log(location);
});
```

## Install

	npm install geocoder

## License

MIT

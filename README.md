# ng-front-page

Angularjs directive for full page landing and scolling

## Demo

`demo.html` file contains example usage. [View demo](https://rawgit.com/ytlabs/ng-front-page/master/index.html)

## Installation

```bash
$ bower install ng-front-page
```

## Usage

1. Require `ng-front-page.js` in your html file

```<script src="ng-front-page.js"></script>```

2. Require base CSS style

  a. If you use less import `ng-front-page.less` in your less file

  ```@import "ng-front-page.less"```

  b. Else require `ng-front-page.css` in your html file

  ```<link rel="stylesheet" href="ng-front-page.css">```

3. Add module name 'ngFrontPage' to your apps dependencies

  ```js
  var app = angular.module('yourApp', ['ngFrontPage']);
  ```

4. Add `front-page` or `data-front-page` attribute to the parent element.

  ```<div data-front-page data-options="options"></div>```

5. Add `slide-container` if horizontal slide is required.

6. Add `slide` class for each child slide page

7. Add `horizontal-nav` if page indicator is required.

8. Add `prev-button` and  `next-button` if previous and next slide buttons are required.

  ```html
  <div data-front-page data-options="options">
      <div class="slide-container">
        <div class="slide"></div>
        <div class="slide"></div>
      </div>

    <div class="prev-button"></div>
    <div class="next-button"></div>
    <div class="horizontal-nav"></div>
  </div>
  ```

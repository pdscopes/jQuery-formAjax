## How to use
```javascript
$('#form').ajaxForm({
  responses: {
    200: function (data) {
      window.location = '/page/to/go/to.html';
    }
  }
});
```

## Change defaults
### Data Type
Currently supported data types are:
* `json`
* `formdata`

For example, to set the default data type of the sent form body to `json`:
```javascript
$.fn.formAjax.defaults.dataType = 'json';
```
### Display Error
If the server returns a 422 response `formAjax` will attempt to display the error. This function can be overidden as follows:
```javascript
// Add to the default ajax object a beforeSend function to hide and empty the errors
$.fn.formAjax.defaults.ajax.beforeSend = function () {
  if ($('.error-container').is(':visible')) {
    $('.error-container').hide();
    $('.errors').empty();
  }
};
// Alter the displayError function to show the errors in the error-container
$.fn.formAjax.defaults.displayError = function(input, errors) {
  let $errorContainer = $('.error-container'),
      $errors = $('.errors');
  $errorContainer.show();

  errors = Array.isArray(errors)
      ? errors
      : Object.keys(errors).map(function (key) { return errors[key]; });

  for (let er in errors) {
    $errors.append(`<li>${errors[er]}</li>`);
  }
};
```

This will before send hide and empty the `error-container` then if errors are returned populate the `error-container`.

/**
 * The {@link http://learn.jquery.com/plugins/|jQuery Plugins} namespace
 * @external "jQuery.fn"
 */
(function ($) {
    "use strict";


    /**
     * This callback should render reported errors for the specified input field.
     * @callback callbackDisplayError
     * @param {HTMLElement} input   Element that was reported as invalid
     * @param {object}      errors  Set of messages to be displayed
     */
    /**
     * @callback callbackAjaxSuccess
     * @param {*} data
     * @param {string} textStatus
     * @param jqXHR
     */
    /**
     * @callback callbackAjaxError
     * @param jqXHR
     * @param {string} textStatus
     * @param {Error} errorThrown
     */
    /**
     * @typedef {object} formAjaxOption
     * @property {string} [action=bind]        Action to happen: "bind" or "submit"
     * @property {string} [dataType=formData]  What format to send the data as: "formData" or "json"
     * @property {object} [ajax]               Settings object passed directly to AJAX call on submit
     * @property {object} [responses]          Object of functions defining AJAX response behaviour. Can
     *                                         either be a specific HTTP status code (e.g. 204) or a
     *                                         generic status (e.g. 2XX)
     * @property {callbackDisplayError} [displayError]
     * @property {HTMLFormElement} [form]      Automatically populated
     */
    /**
     * Binds the form to submit via AJAX or immediately submits the form via AJAX.
     * The AJAX settings object has the following defaults:
     * <code>
     * {
     *    context: /* formAjaxOption *\/,
     *    url: /* form action *\/,
     *    data: /* serialised form *\/,
     *    contentType: /* based on dataType *\/
     * }
     * </code>
     * @function
     * @memberOf external:"jQuery.fn"
     * @param {formAjaxOption} option
     *
     * @example
     * $('#myForm').formAjax({ /** configuration object *\/});
     */
    $.fn.formAjax = function(option) {
        return this.each(function () {
            // Fail fast, fail early
            if (this.tagName.toLowerCase() !== 'form') {
                return ;
            }

            // Extend our default options with those provided.
            var options = (typeof option === 'object' && option) || {};
            options = $.extend({form: this}, $.fn.formAjax.defaults, option);
            options.ajax = $.extend({
                method: $(this).data('ajax-method') || 'POST'
            }, $.fn.formAjax.defaults.ajax, options.ajax);
            options.responses = $.extend($.fn.formAjax.defaults.responses, options.responses);
            $(this).data('formAjax', options);


            switch (options.action) {
                case 'bind':
                    $(this).on('submit', function (e) {
                        e.preventDefault();
                        submit(options);
                        return false;
                    });
                    break;

                case 'submit':
                    submit(options);
                    break;
            }
        });
    };

    /**
     * @function
     * @memberOf external:"jQuery.fn"
     * @type {formAjaxOption}
     */
    $.fn.formAjax.defaults = {
        action: 'bind',
        dataType: 'formData',
        ajax: {
            success: function (data, textStatus, jqXHR) {
                /** @var {formAjaxOption} options */
                var options = this;
                // Try to find a specific status response handler
                if (options.responses.hasOwnProperty(jqXHR.status)) {
                    options.responses[jqXHR.status].call(options.form, jqXHR, textStatus, data);
                    return;
                }
                // Fall back to a generic status response handler
                var genericStatus = Math.floor(jqXHR.status/100) + 'XX';
                if (options.responses.hasOwnProperty(genericStatus)) {
                    options.responses[genericStatus].call(options.form, jqXHR, textStatus, data);
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                /** @var {formAjaxOption} options */
                var options = this;
                // Try to find a specific status response handler
                if (options.responses.hasOwnProperty(jqXHR.status)) {
                    options.responses[jqXHR.status].call(options, jqXHR, textStatus, errorThrown);
                    return;
                }
                // Fall back to a generic status response handler
                var genericStatus = Math.floor(jqXHR.status/100) + 'XX';
                if (options.responses.hasOwnProperty(genericStatus)) {
                    options.responses[genericStatus].call(options, jqXHR, textStatus, errorThrown);
                }
            }
        },
        responses: {
            422: function (jqXHR) {
                /** @var formAjaxOption */
                var options = this;
                var data = JSON.parse(jqXHR.responseText);
                for (var el in data.errors) {
                    if (!data.errors.hasOwnProperty(el)) {
                        continue;
                    }
                    var input = findElementByName($(options.form), el);
                    if (options.displayError) {
                        options.displayError(input, data.errors[el]);
                    } else {
                        $.fn.formAjax.displayError(input, data.errors[el]);
                    }
                }
            }
        },
        displayError: null
    };

    /**
     * Display the returned error.
     * @function
     * @memberOf external:"jQuery.fn"
     * @type {callbackDisplayError}
     * @see callbackDisplayError
     */
    $.fn.formAjax.displayError = function(input, errors) {
        // Do nothing if the input was not found
        if (!input) {
            return;
        }
        errors = Array.isArray(errors)
            ? errors
            : Object.keys(errors).map(function (key) { return errors[key]; });
        input.setCustomValidity(errors.join('. '));
        input.reportValidity();
        $(input).on('change', function () {
            this.setCustomValidity('');
        });
    };


    /**
     * Submit the form using AJAX.
     * @function
     * @memberOf external:"jQuery.fn"
     * @param {formAjaxOption} option
     */
    function submit(option) {
        var settings = $.extend({}, {
            context: option,
            url: option.form.action,
            data: serialiseFormData(option.dataType, $(option.form)),
            contentType: contentType(option.dataType),
            processData: false
        }, option.ajax);

        $.ajax(settings);
    }

    /**
     * Serialise the form data into a string to be sent.
     * @param {string} dataType
     * @param {jQuery} $form
     * @returns {string|FormData}
     */
    function serialiseFormData(dataType, $form) {
        switch (dataType.toLowerCase()) {
            case 'json':
                var json = {};
                var formArray = serializeArray.call($form);
                for (var j=0; j<formArray.length; j++) {
                    Dots.set(json, Dots.convertTo(formArray[j].name), formArray[j].value);
                }

                return JSON.stringify(json);

            case 'formdata':
                return window.FormData ? new FormData($form[0]) : $form.serialize();

            default:
                return $form.serialize();
        }
    }

    /**
     * Specify the content type based on the data type.
     * @param {string} dataType
     * @returns {*}
     */
    function contentType(dataType) {
        switch (dataType.toLowerCase()) {
            case 'json':
                return 'application/json';

            case 'formdata':
                return false;

            default:
                return 'application/x-www-form-urlencoded';
        }
    }

    /**
     * Taken directly from jQuery.
     * Adds the ability to use "data-type" to force type conversion.
     * i.e.:
     *      <input type="text" name="amount" data-type="float" value="15.01">
     *
     *      {"amount":15.01} rather than {"amount":"15.01"}
     * @see jQuery.serializeArray
     */
    function serializeArray() {
        var rcheckableType = ( /^(?:checkbox|radio)$/i ),
            rCRLF = /\r?\n/g,
            rsubmitterTypes = /^(?:submit|button|image|reset|file)$/i,
            rsubmittable = /^(?:input|select|textarea|keygen)/i;

        return this.map( function() {

            // Can add propHook for "elements" to filter or add form elements
            var elements = jQuery.prop( this, "elements" );
            return elements ? jQuery.makeArray( elements ) : this;
        } )
            .filter( function() {
                var type = this.type;

                // Use .is( ":disabled" ) so that fieldset[disabled] works
                return this.name && !jQuery( this ).is( ":disabled" ) &&
                    rsubmittable.test( this.nodeName ) && !rsubmitterTypes.test( type ) &&
                    ( this.checked || !rcheckableType.test( type ) );
            } )
            .map( function( i, elem ) {
                var val = jQuery( this ).val();

                if ( val === null ) {
                    return null;
                }

                if ( jQuery.isArray( val ) ) {
                    return jQuery.map( val, function( val ) {
                        return { name: elem.name, value: castInputValue(val, $(this).data('type') , rCRLF) };
                    } );
                }

                return { name: elem.name, value: castInputValue(val, $(this).data('type'), rCRLF) };
            } ).get();
    }

    /**
     * @param {string} value
     * @param {string} type
     * @param {string} rCRLF
     * @returns {*}
     */
    function castInputValue(value, type, rCRLF) {
        if (type === 'int' && String(Math.floor(parseInt(value))) === value) {
            return parseInt(value);
        }
        if (type === 'float' && String(parseFloat(value)) === value) {
            return parseFloat(value);
        }
        if (type === 'bool') {
            return !(value === '' || value === '0');
        }
        if (value === '') {
            return null;
        }
        // Default action
        return value.replace(rCRLF, "\r\n");
    }

    /**
     * Attempt to find the form element given the dots notation name.
     * @param {jQuery} $form
     * @param {string} dots
     */
    function findElementByName($form, dots) {
        var el, i, j, part = 0;

        var parts = dots.split('.');
        var selectors = [parts[0]];

        for (i=1; i<parts.length; i++) {
            part = 0;
            var temp = [];
            // Prioritise exact matches
            for (j=0; j<selectors.length; j++) {
                temp.push(selectors[j] + '[' + parts[i] + ']');
            }
            // Try potential matches
            if (!isNaN(parts[i]) || parts[i] === '*') {
                part = parts[i] === '*' ? 0 : parseInt(parts[i]);
                for (j=0; j<selectors.length; j++) {
                    temp.push(selectors[j] + '[]');
                }
            }
            selectors = temp;
        }
        for (i=0; i<selectors.length; i++) {
            el = $form.find('[name="' + selectors[i] + '"]');
            if (el.length > part) {
                return el[part];
            }
        }
        return null;
    }
}(jQuery));

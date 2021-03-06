// Copyright 2015 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Service to construct URLs by inserting variables within them as
 * necessary to have a fully-qualified URL.
 *
 * @author henning.benmax@gmail.com (Ben Henning)
 */

oppia.factory('UrlInterpolationService', ['warningsData',
    function(warningsData) {
  // http://stackoverflow.com/questions/203739
  var _isString = function(value) {
    return (typeof(value) === 'string') || (value instanceof String);
  };

  return {
    /**
     * Given a formatted URL, interpolates the URL by inserting values the URL
     * needs using the interpolationValues object. For example, urlTemplate
     * might be:
     *
     *   /createhandler/resolved_answers/<exploration_id>/<escaped_state_name>
     *
     * interpolationValues is an object whose keys are variables within the URL.
     * For the above example, interpolationValues may look something like:
     *
     *   { 'exploration_id': '0', 'escaped_state_name': 'InputBinaryNumber' }
     *
     * If a URL requires a value which is not keyed within the
     * interpolationValues object, this will return null.
     */
    interpolateUrl: function(urlTemplate, interpolationValues) {
      if (!urlTemplate) {
        warningsData.fatalWarning(
          'Invalid or empty URL template passed in: \'' +
          new String(urlTemplate) + '\'');
        return null;
      }

      // http://stackoverflow.com/questions/4775722
      if (!(interpolationValues instanceof Object) || (
          Object.prototype.toString.call(
            interpolationValues) === '[object Array]')) {
        warningsData.fatalWarning(
          'Expected an object of interpolation values to be passed into ' +
          'interpolateUrl.');
        return null;
      }

      // Valid pattern: <alphanum>
      var INTERPOLATION_VARIABLE_REGEX = /<(\w+)>/;

      // Invalid patterns: <<stuff>>, <stuff>>>, <>
      var EMPTY_VARIABLE_REGEX = /<>/;
      var INVALID_VARIABLE_REGEX = /(<{2,})(\w*)(>{2,})/;

      // Parameter values can only contain alphanumerical characters.
      var VALID_PARAMETER_VALUE_REGEX = /^(\w| )+$/;

      if (urlTemplate.match(INVALID_VARIABLE_REGEX) ||
          urlTemplate.match(EMPTY_VARIABLE_REGEX)) {
        warningsData.fatalWarning(
          'Invalid URL template received: \'' + urlTemplate + '\'');
        return null;
      }

      var escapedInterpolationValues = {};
      for (var varName in interpolationValues) {
        var value = interpolationValues[varName];
        if (!_isString(value)) {
          warningsData.fatalWarning(
            'Parameters passed into interpolateUrl must be strings.');
          return null;
        }

        // Ensure the value is valid.
        if (!value.match(VALID_PARAMETER_VALUE_REGEX)) {
          warningsData.fatalWarning(
            'Parameter values passed into interpolateUrl must only contain ' +
            'alphanumerical characters or spaces: \'' + value + '\'');
          return null;
        }

        escapedInterpolationValues[varName] = encodeURIComponent(value);
      }

      // Ensure the URL has no nested brackets (which would lead to indirection
      // in the interpolated variables).
      var filledUrl = angular.copy(urlTemplate);
      var match = filledUrl.match(INTERPOLATION_VARIABLE_REGEX);
      while (match) {
        var varName = match[1];
        if (!escapedInterpolationValues.hasOwnProperty(varName)) {
          warningsData.fatalWarning('Expected variable \'' + varName +
            '\' when interpolating URL.');
          return null;
        }
        filledUrl = filledUrl.replace(
          INTERPOLATION_VARIABLE_REGEX,
          escapedInterpolationValues[varName]);
        match = filledUrl.match(INTERPOLATION_VARIABLE_REGEX);
      }
      return filledUrl;
    }
  };
}]);

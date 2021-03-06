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
 * @fileoverview Unit tests for UrlInterpolationService.
 *
 * @author henning.benmax@gmail.com (Ben Henning)
 */

describe('URL Interpolation Service', function() {
  var uis = null;

  beforeEach(module('oppia'));

  beforeEach(inject(function($injector) {
    uis = $injector.get('UrlInterpolationService');
  }));

  it('should throw an exception for erroneous URLs', function() {
    expect(function() { uis.interpolateUrl(); }).toThrow(
      new Error('Invalid or empty URL template passed in: \'undefined\''));
    expect(function() { uis.interpolateUrl(null, {}); }).toThrow(
      new Error('Invalid or empty URL template passed in: \'null\''));
    expect(function() { uis.interpolateUrl(undefined, {}); }).toThrow(
      new Error('Invalid or empty URL template passed in: \'undefined\''));
    expect(function() { uis.interpolateUrl('', {}); }).toThrow(
      new Error('Invalid or empty URL template passed in: \'\''));
    expect(function() { uis.interpolateUrl(''); }).toThrow(
      new Error('Invalid or empty URL template passed in: \'\''));
  });

  it('should throw an exception for erroneous interpolation values', function() {
    expect(function() { uis.interpolateUrl('url', null); }).toThrow(
      new Error('Expected an object of interpolation values to be passed ' +
        'into interpolateUrl.'));
    expect(function() { uis.interpolateUrl('url', undefined); }).toThrow(
      new Error('Expected an object of interpolation values to be passed ' +
        'into interpolateUrl.'));
    expect(function() {
        uis.interpolateUrl('/test_url/<param>', 'value');
      }).toThrow(new Error(
        'Expected an object of interpolation values to be passed into ' +
        'interpolateUrl.'));
    expect(function() {
        uis.interpolateUrl('/test_url/<param>', ['value']);
      }).toThrow(new Error(
        'Expected an object of interpolation values to be passed into ' +
        'interpolateUrl.'));
  });

  it('should interpolate URLs not requiring parameters', function() {
    expect(uis.interpolateUrl('/test_url/', {})).toBe('/test_url/');
    expect(uis.interpolateUrl('/test_url/', {'param': 'value'})).toBe(
      '/test_url/');
  });

  it('should interpolate URLs requiring one or more parameters', function() {
    expect(uis.interpolateUrl('/test_url/<fparam>', {'fparam': 'value'})).toBe(
      '/test_url/value');
    expect(uis.interpolateUrl(
      '/test_url/<first_param>/<second_param>/<third_param>', {
        'first_param': 'value1',
        'second_param': 'value2',
        'third_param': new String('value3')
      })).toBe('/test_url/value1/value2/value3');
  });

  it('should interpolate parameters within words or adjacent to other parameters', function() {
    // It also doesn't need to have '/' prefixing the URL.
    expect(uis.interpolateUrl(
      'word<with_param>', {'with_param': '_with_value'}))
    .toBe('word_with_value');
    expect(uis.interpolateUrl('Eating_<param1><param2>_with_syrup', {
      'param1': 'pan', 'param2': 'cakes'
    })).toBe('Eating_pancakes_with_syrup');
  });

  it('should interpolate parameters beginning, ending, or composing the URL', function() {
    expect(uis.interpolateUrl('<prefix>_with_words', {'prefix': 'Signs'})).toBe(
      'Signs_with_words');
    expect(uis.interpolateUrl('Neither_here_nor_<suffix>', {
      'suffix': 'anywhere'
    })).toBe('Neither_here_nor_anywhere');
    expect(uis.interpolateUrl('<param>', {'param': 'value'})).toBe('value');
  });

  it('should sanitize parameters but not URLs', function() {
    expect(uis.interpolateUrl('URL with a space', {})).toBe(
      'URL with a space');
    expect(uis.interpolateUrl(
      '/test_url/<first_param>?<query_name>=<query_value>', {
        'first_param': 'SEARCH',
        'query_name': 'title or website',
        'query_value': 'oppia'
      })).toBe('/test_url/SEARCH?title%20or%20website=oppia');
  });

  it('should not interpolate bad parameter names and values', function() {
    // Empty angle brackets indicate a malformed URL.
    expect(function() { uis.interpolateUrl('/test_url/<>', {}); }).toThrow(
      new Error('Invalid URL template received: \'/test_url/<>\''));
    expect(function() {
        uis.interpolateUrl('/test_url/<>', {'': 'value'});
      }).toThrow(new Error('Invalid URL template received: \'/test_url/<>\''));

    // Non alpha-numeric will not match the pattern matching for finding a
    // parameter name.
    expect('/test_url/<b@d!#$%^&*() p@r@m n@m3`~[]{}>', {}).toBe(
      '/test_url/<b@d!#$%^&*() p@r@m n@m3`~[]{}>');

    // Parameter names cannot have spaces.
    expect(uis.interpolateUrl('/test_url/<parameter with spaces>', {
      'parameter with spaces': 'value'
    })).toBe('/test_url/<parameter with spaces>');

    expect(function() {
        uis.interpolateUrl('/test_url/<<name>>', {'name': 'value'});
      }).toThrow(new Error(
        'Invalid URL template received: \'/test_url/<<name>>\''));

    expect(function() {
        uis.interpolateUrl('/test_url/<name>', {'name': '<value>'});
      }).toThrow(new Error(
        'Parameter values passed into interpolateUrl must only contain ' +
        'alphanumerical characters or spaces: \'<value>\''));

    expect(function() {
        uis.interpolateUrl('/test_url/<name>', {'name': '<<value>>'});
      }).toThrow(new Error(
        'Parameter values passed into interpolateUrl must only contain ' +
        'alphanumerical characters or spaces: \'<<value>>\''));

    expect(function() {
        uis.interpolateUrl('/test_url/<name>', {'name': '<>'});
      }).toThrow(new Error(
        'Parameter values passed into interpolateUrl must only contain ' +
        'alphanumerical characters or spaces: \'<>\''));

    // Values cannot contain non-alphanumerical characters or spaces, including
    // newlines or website symbols.
    expect(function() {
        uis.interpolateUrl('/test_url/?<query_name>=<query_value>', {
          'query_name': 'website',
          'query_value': 'https://www.oppia.org/'
        });
      }).toThrow(new Error(
        'Parameter values passed into interpolateUrl must only contain ' +
        'alphanumerical characters or spaces: \'https://www.oppia.org/\''));

    expect(function() {
        uis.interpolateUrl('/test_url/<name>', {
          'name': 'value\nmultiple lines'
        });
      }).toThrow(new Error(
        'Parameter values passed into interpolateUrl must only contain ' +
        'alphanumerical characters or spaces: \'value\nmultiple lines\''));
  });

  it('should throw an exception for missing parameters', function() {
    expect(function() { uis.interpolateUrl('/test_url/<page>', {}); }).toThrow(
      new Error('Expected variable \'page\' when interpolating URL.'));
    expect(function() {
        uis.interpolateUrl('/test_url/<page1>', {'page2': 'v'});
      }).toThrow(new Error(
        'Expected variable \'page1\' when interpolating URL.'));
  });

  it('should throw an exception for non-string parameters', function() {
    expect(function() {
        uis.interpolateUrl('/test_url/<page>', {'page': 0});
      }).toThrow(new Error(
        'Parameters passed into interpolateUrl must be strings.'));
    expect(function() {
        uis.interpolateUrl('/test_url/<page>', {'page': {}});
      }).toThrow(new Error(
        'Parameters passed into interpolateUrl must be strings.'));
    expect(function() {
        uis.interpolateUrl('/test_url/<page>', {'page': []});
      }).toThrow(new Error(
        'Parameters passed into interpolateUrl must be strings.'));
    expect(function() {
        uis.interpolateUrl('/test_url/<page>', {'page': /abc/});
      }).toThrow(new Error(
        'Parameters passed into interpolateUrl must be strings.'));
  });
});
